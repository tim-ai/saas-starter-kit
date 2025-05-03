import packageInfo from '../package.json';
import env from './env';

const app = {
  version: packageInfo.version,
  name: 'NITPICKER',
  logoUrl: '/logo.jpg',
  url: env.appUrl,
};

export default app;
