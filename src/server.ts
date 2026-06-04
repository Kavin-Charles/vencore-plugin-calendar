import { createPlugin } from '@vencore/plugin-sdk';

export default createPlugin({
  async setup(vencore) {
    vencore.on('contact.created', async (payload) => {
      await vencore.bus.emit('com.vencore.calendar.event.created', {
        trigger: 'contact.created',
        payload,
      });
    });
  },
});
