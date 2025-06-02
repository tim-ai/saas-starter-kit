import cron from 'node-cron';

type CronJob = {
  name: string;
  schedule: string;
  job: () => Promise<void>;
};

class CronService {
  private jobs: CronJob[] = [];
  
  registerJob(job: CronJob) {
    this.jobs.push(job);
  }

  start() {
    for (const job of this.jobs) {
      cron.schedule(job.schedule, job.job);
      console.log(`Registered cron job: ${job.name} with schedule ${job.schedule}`);
    }
  }
}

export const cronService = new CronService();