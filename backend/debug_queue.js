const Queue = require('bull');

const remindersQueue = new Queue('reminders', {
    redis: { port: 6379, host: 'localhost' }
});

async function checkQueue() {
    console.log('Checking Reminders Queue...');

    const counts = await remindersQueue.getJobCounts();
    console.log('Job Counts:', counts);

    if (counts.failed > 0) {
        const failed = await remindersQueue.getFailed(0, 5);
        console.log('--- Failed Jobs (Last 5) ---');
        failed.forEach(job => {
            console.log(`ID: ${job.id}`);
            console.log('Error:', job.failedReason);
            // console.log('Stack:', job.stacktrace); // stacktrace is array
        });
    }

    if (counts.waiting > 0) {
        console.log('--- Jobs Waiting ---');
        const waiting = await remindersQueue.getWaiting(0, 5);
        waiting.forEach(job => {
            console.log(`ID: ${job.id}, Data:`, job.data);
        });
    }

    process.exit(0);
}

checkQueue();
