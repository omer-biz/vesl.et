import rss from '@astrojs/rss';
import getLogsCollection from '../lib/logsCollection';

export async function GET(context) {
    const logs = await getLogsCollection();

    return rss({
        title: 'Omer’s Blog',
        description: 'just a curious mind venturing through the digital jungle.',
        site: context.site,
        items: logs.map((log) => ({
            title: log.data.title,
            pubDate: log.data.pubDate,
            description: log.data.description,
            link: `/logs/${log.id}`,
        })),
    });
}
