import { Queue } from 'bullmq';
import { connection } from './redis-config'; // Your Redis connection options

const bulkRowCreateQueue = new Queue('bulkRowCreateQueue', {
    connection
});

const bulkRowDeleteQueue = new Queue('bulkRowDeleteQueue', {
    connection
});

export { bulkRowCreateQueue, bulkRowDeleteQueue };