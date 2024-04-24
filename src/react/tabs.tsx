import React, { ReactNode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ProfileType } from '../@types/profile';

const root = createRoot(document.body);

interface TabProps {
  active?: boolean
  children: ReactNode
}

const Tab = ({ active = false, children }: TabProps) => {
  return <li data-active={active} className='flex items-center cursor-pointer justify-center rounded border rounded-b-none border-b-0 px-4 data-[active=true]:bg-green-500 data-[active=true]:text-white'>{children}</li>
}

const Tabs = () => {
  const [profile, setProfile] = useState<ProfileType | null>()

  useEffect(() => {
    window.DesktopApi.onProfileChange((_, profile) => {
      console.log(profile)
      setProfile(profile)
    })
  }, [])
  return (
    <nav>
      <ul className='flex m-1 mb-0 gap-1 border-b-2 h-[46px]'>
        <Tab active>Painel</Tab>
          {profile && (
          <>
            <Tab>PDV</Tab>
            <Tab>Cardápio</Tab>
            <Tab>Robô Whatsapp</Tab>
          </>
          )}
      </ul>
    </nav>
  )
}

root.render(<Tabs />)