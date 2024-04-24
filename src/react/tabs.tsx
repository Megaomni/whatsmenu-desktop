import React, { ComponentProps, ReactNode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ProfileType } from '../@types/profile';
import * as RadixTabs from '@radix-ui/react-tabs';

const root = createRoot(document.body);

type TabProps = RadixTabs.TabsTriggerProps

const Tab = ({ children, ...props }: TabProps) => {
  const tabRef = useRef<HTMLButtonElement>(null)
  const handleSetTab = () => {
    window.TabsApi.setActiveTab(props.value)
  }
  return (
    <RadixTabs.Trigger 
      className='flex items-center cursor-pointer justify-center rounded border rounded-b-none border-b-0 px-4 data-[state=active]:bg-green-500 data-[state=active]:text-white'
      ref={tabRef}
      onClick={handleSetTab}
      {...props}
    >
      {children}
    </RadixTabs.Trigger>
  )
}

const Tabs = () => {
  const [profile, setProfile] = useState<ProfileType | null>()

  useEffect(() => {
    window.DesktopApi.onProfileChange((_, profile) => {
      setProfile(profile)
    })
  }, [])
  return (
    <RadixTabs.Root>
      <RadixTabs.List className='flex m-1 mb-0 gap-1 border-b-2 h-[46px]'>
        <Tab value="dashboard">Painel</Tab>
          {profile && (
          <>
            <Tab value="pdv">PDV</Tab>
            <Tab value="menu">Cardápio</Tab>
            <Tab value="bot">Robô Whatsapp</Tab>
          </>
          )}
      </RadixTabs.List>
    </RadixTabs.Root>
  )
}

root.render(<Tabs />)