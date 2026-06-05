export default {
  setup(vencore: any) {
    vencore.log('Calendar plugin initializing...');

    vencore.on('contact.created', async (record: any) => {
      vencore.log(`New contact created, calendar plugin reacting: ${record.id}`);
    });

    vencore.cron.register('0 9 * * *', 'daily-briefing', async () => {
      vencore.log('Running daily calendar briefing.');
    });
  },
};
