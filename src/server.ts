import { createPlugin } from '@vantage/plugin-sdk';

export default createPlugin({
  async setup(vantage) {
    vantage.on('contact.created', async (payload) => {
      await vantage.bus.emit('com.vantage.calendar.event.created', {
        trigger: 'contact.created',
        payload,
      });
    });
  },
});
