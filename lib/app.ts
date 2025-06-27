import packageInfo from '../package.json';
import env from './env';

const app = {
  version: packageInfo.version,
  name: 'NITPICKER',
  logoUrl: 'https://nitpickr.net/logo.jpg',
  url: env.appUrl,
};

export default app;
