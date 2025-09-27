import chalk from 'chalk';

export const logger = {
  info(msg: string) {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    console.log(chalk.blueBright(`📝 | ${msg}`));
  },
};
