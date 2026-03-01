import { google, calendar_v3 } from 'googleapis';
import { prisma } from './prisma';

export async function getGoogleCalendarClient(userId: string) {
    // Retrieve the user's account to get the access token and refresh token
    const account = await prisma.account.findFirst({
        where: {
            userId: userId,
            provider: 'google',
        },
    });

    if (!account || !account.access_token) {
        throw new Error('Google account not linked or access token missing.');
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.NEXTAUTH_URL
    );

    oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        // Google API uses milliseconds
        expiry_date: account.expires_at ? account.expires_at * 1000 : null,
    });

    // Handle automatic token refresh and update the DB if refreshed
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            const dataToUpdate: any = {
                access_token: tokens.access_token,
                expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : account.expires_at,
            };

            if (tokens.refresh_token) {
                dataToUpdate.refresh_token = tokens.refresh_token;
            }

            await prisma.account.update({
                where: { id: account.id },
                data: dataToUpdate,
            });
        }
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function listGoogleCalendarEvents(userId: string, timeMin: Date, timeMax: Date) {
    const calendar = await getGoogleCalendarClient(userId);
    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
    });
    return response.data.items || [];
}

export async function createGoogleCalendarEvent(userId: string, eventData: calendar_v3.Schema$Event) {
    const calendar = await getGoogleCalendarClient(userId);
    const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventData,
    });
    return response.data;
}

export async function updateGoogleCalendarEvent(userId: string, eventId: string, eventData: calendar_v3.Schema$Event) {
    const calendar = await getGoogleCalendarClient(userId);
    const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: eventData,
    });
    return response.data;
}

export async function deleteGoogleCalendarEvent(userId: string, eventId: string) {
    const calendar = await getGoogleCalendarClient(userId);
    await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
    });
    return true;
}
