import Head from 'next/head';
import { ReactNode } from 'react';

import Footer from 'components/footer';
import Header from 'components/header';

export interface PageProps {
  name: string;
  children: ReactNode;
  header?: boolean;
}

export default function Page({ name, children, header = true }: PageProps): JSX.Element {
  return (
    <>
      <Head>
        <title>{`${name} - Saint Michael Trio`}</title>
        <meta
          name='description'
          content='The Saint Michael Trio (Robin Sharp, violin; Russell Hancock, piano; Michel Flexer, cello) is hailed as Silicon Valley’s update to the classical music scene.'
        />
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width,initial-scale=1.0' />
        <link rel='preconnect' href='https://fonts.gstatic.com' />
        <link
          href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
          rel='stylesheet'
        />
      </Head>
      <div>
        {header && <Header />}
        {children}
        <style jsx>{`
          div {
            min-height: 100vh;
          }
        `}</style>
      </div>
      <Footer />
    </>
  );
}
