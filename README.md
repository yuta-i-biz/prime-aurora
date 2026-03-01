# Prime Aurora

Prime Aurora は、タスク管理とGoogleカレンダー連携をシームレスに行うための個人・小規模チーム向けWebアプリケーションです。

## 🌐 サイトURL
**[Prime Aurora アプリケーションを開く](https://prime-aurora-xi.vercel.app/)**
- タスク管理画面: `/tasks`
- カレンダー画面: `/calendar`

---

## 🚀 使い方と主な機能

### 1. タスク管理 (Task Management)
階層ごとのタスク（親タスク ＞ サブタスク ＞ 孫タスク）を作成し、プロジェクトの進捗を管理できます。
- **タスクの作成**: 「新規タスク」ボタンからトップレベルのタスクを作成します。
- **サブタスクの追加**: 各タスクの右側にある「サブタスク追加」から、そのタスクを親とする子タスクを作成できます。
- **状態の変更**: タスクの編集画面から、ステータス（TODO, IN_PROGRESS, DONE）を変更できます。

### 2. カレンダー同期 (Google Calendar Sync)
Googleアカウントでログインすることで、自身のGoogleカレンダーと連携します。
- **予定の閲覧**: `/calendar` 画面で「月」「週」「日」の3つのビューで予定を確認できます。
- **予定の直接編集**: アプリカレンダー上の予定をクリックすると、Auraから離れることなく**時間の変更や予定の削除**が可能です。これらの変更は即座にGoogleカレンダー本家にも反映されます。

### 3. カレンダーからタスクへの取り込み (Inbox機能)
「カレンダーに予定として入れたが、作業タスクとして管理し忘れているもの」を拾い上げるための機能です。
- タスク画面右上の**「📅 取り込み」ボタン**を押すと、まだタスク化されていないGoogleカレンダーの予定がリストアップされます。
- **取り込み先（親タスク）を選択**して「＋」ボタンを押すことで、その予定を既存プロジェクトのサブタスクとして一瞬でタスク化できます。

---

## 🏗️ システム構成 (アーキテクチャ)

### 技術スタック
- **Front-end / Back-end**: [Next.js (App Router)](https://nextjs.org/)
- **Database (ORM)**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Google OAuth provider)
- **Deployment**: [Vercel](https://vercel.com/)
- **Cloud Database**: [Neon](https://neon.tech/) (PostgreSQL)

### データベース設計 (Schema)

Prismaを利用して構築された主要なデータモデルは以下の通りです。

#### 1. `User` / `Account` / `Session`
NextAuth.jsが管理する認証用テーブルです。Googleでログインしたユーザー情報を保持します。

#### 2. `Task`
Auraのコアとなるタスクデータです。
- `level` (Int): タスクの階層（1: 親, 2: 子, 3: 孫）
- `parentId` (String): サブタスクの場合、親タスクのIDを保持（自己参照リレーション）
- `status` (String): TODO, IN_PROGRESS, DONE
- `googleEventId` (String?): Inbox機能で取り込まれた際、またはタスク作成時にカレンダー同期された際の一致するGoogleカレンダー予定ID。

#### 3. `CachedEvent`
Googleカレンダーの予定をアプリ内に保持するためのキャッシュテーブルです。
- Google APIの通信制限（Rate Limit）や画面表示の遅延を防ぐため、ユーザーがログインした際などにバックグラウンドで「直近数ヶ月の予定」をここに一括保存します。
- カレンダー画面は常にこの高速なローカルDBから予定を読み込んで描画します（Stale-While-Revalidate パターン）。

#### 4. `Organization` / `OrganizationMember`
将来的な「チーム利用」を見据えたデータ構造です。
現在はログイン時に自動で「自分1人だけのOrganization」が作成され、すべてのタスクはそのOrganizationに紐づく形で保存されます。

### プログラムのフロー (Inbox機能の例)
1. **取得時**: `/api/tasks/from-calendar` 
   - DB内の「自分が持っている `CachedEvent`」と「所属組織が持っている `Task`」を比較し、`Task` に存在しない `googleEventId` を持つカレンダー予定だけを抽出してフロントエンドに返します。
2. **保存時**: `/api/tasks/from-calendar/import`
   - フロントエンドから受け取った「選択した予定」と「指定した親タスク(parentId / level)」の情報を元に、新しい `Task` レコードを作成します。

---

## 🔒 今後の展望と制約事項
- **Google APIの公開申請**: 現在はGoogle Cloudコンソール上でテストモードのため、事前に許可されたアカウントしかログインできません。一般公開やチーム利用を開始する際は、GoogleのOAuth審査を通過させる必要があります。
- **パフォーマンス最適化**: Webhook等を用いたリアルタイムなカレンダー同期への移行（現在はページロード時やログイン時の更新が主）。
