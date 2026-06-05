// Zero imports - createPlugin just returns the object unchanged

export default {
  setup(vantage: any) {
    vantage.log('Calendar plugin initializing...');

    vantage.hooks.onRecordCreated('contact', async (record: any) => {
      vantage.log(`New contact created, calendar plugin reacting: ${record.id}`);
    });

    vantage.cron.register('0 9 * * *', 'daily-briefing', async () => {
      console.log('Running daily calendar briefing.');
    });
  },
};
