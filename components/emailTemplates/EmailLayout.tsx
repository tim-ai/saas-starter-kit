import React, { ReactNode } from 'react';
//import Link from 'next/link';

import {
  Body,
  Container,
  Hr,
  //Img,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import app from '@/lib/app';

interface EmailLayoutProps {
  children: ReactNode;
}

const EmailLayout = ({ children }: EmailLayoutProps) => {
  return (
    <Tailwind
      config={{
        theme: {
          extend: {
            colors: {
              brand: '#25c2a0',
            },
          },
        },
      }}
    >
      <Body className="bg-white my-auto mx-auto font-sans">
        <Container className="border border-solid bg-white border-[#f0f0f0] rounded my-[40px] mx-auto p-[20px] w-[465px]">
          {/* <Img
            src={app.logoUrl}
            // width="50"
            height="50"
            alt={app.name}
            className="my-8 mx-auto"
          /> */}
          <div className="flex justify-center mb-8">
            <svg width="230" height="50" viewBox="0 0 230 50" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" stroke="#6B7280" strokeWidth="2.5">
                <circle cx="25" cy="25" r="10"/>
                <line x1="32" y1="32" x2="40" y2="40"/>
              </g>
              <text 
                x="55" 
                y="32" 
                fontFamily="Montserrat, Arial, sans-serif" 
                fontSize="28" 
                fontWeight="800" 
                fill="#374151" 
              > 
                NITPICKR<tspan fill="#4B5563">.NET</tspan> 
              </text>
            </svg>
            </div>
          <Section>{children}</Section>
          <Section>
            <Hr className="border border-solid border-[#eaeaea] my-[20px] mx-0 w-full" />
            <Text className="my-0 text-center text-xs text-[#666666]">
              <span className="block">{app.name}</span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  );
};

export default EmailLayout;
