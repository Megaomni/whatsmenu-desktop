import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ProfileType } from '../@types/profile';
import * as RadixTabs from '@radix-ui/react-tabs';

import { FaCashRegister, FaRobot } from "react-icons/fa";
import { IoSettings } from "react-icons/io5";
import { MdMenuBook } from "react-icons/md";
import { IconContext } from 'react-icons';

const root = createRoot(document.body);

type TabProps = RadixTabs.TabsTriggerProps & {
  tabTitle: string
  icon?: ReactNode
}

const Tab = ({ icon, tabTitle, ...props }: TabProps) => {
  const tabRef = useRef<HTMLButtonElement>(null)
  const handleSetTab = () => {
    window.TabsApi.setActiveTab(props.value)
  }
  return (
    <RadixTabs.Trigger
      
      className='text-xs leading-snug flex items-center cursor-pointer justify-between text-center text-zinc-950 w-64 h-[34px] px-4 border-b-2 border-white relative
      data-[state=inactive]:before:content-["|"]
    data-[state=active]:bg-white data-[state=active]:border-b-0
      data-[state=active]:rounded-t-[8px]

      before:pointer-events-none
      data-[state=active]:before:text-transparent before:absolute before:right-2 before:top-2
    data-[state=active]:before:bg-zinc-200 
    data-[state=active]:before:border-white data-[state=active]:before:border-bl-4 data-[state=active]:before:border-r-4
      data-[state=active]:before:right-[252px] data-[state=active]:before:w-20 data-[state=active]:before:top-2 data-[state=active]:before:rounded-b-[8px] data-[state=active]:before:bottom-0
      
      after:pointer-events-none
      data-[state=active]:after:text-transparent after:absolute after:right-2 after:top-1
    data-[state=active]:after:bg-zinc-200
    data-[state=active]:after:border-white data-[state=active]:after:border-b-4 data-[state=active]:after:border-l-4
      data-[state=active]:after:left-[252px] data-[state=active]:after:w-screen data-[state=active]:after:top-2 data-[state=active]:after:rounded-b-[8px] data-[state=active]:after:bottom-0
      '
      ref={tabRef}
      onClick={handleSetTab}
      {...props}
    >
      <div className='flex gap-2 flex-grow items-center '>
        {icon}
        <span>{tabTitle}</span>
      </div>
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
    
    <RadixTabs.Root defaultValue='dashboard'>
      <IconContext.Provider value={{ size: '16', className: 'text-green-500' }}>
        <div
          style={{
            overflow: 'hidden'
          }}
          className='bg-zinc-200 w-full  border-b-white border-2 overflow-y-hidden'
        >

        <RadixTabs.List 
          style={{
            overflow: 'hidden'
          }}
          className='flex p-2 pb-0 h-[38px]'
        >
          <Tab 
            value="dashboard"
            tabTitle='Painel'
            icon={<IoSettings />}
          >
            
          </Tab>
            {profile && (
            <>
              <Tab 
                value="pdv" 
                tabTitle='PDV'
                icon={<FaCashRegister />}
              />
              <Tab 
                value="menu"
                tabTitle='Menu'
                icon={<MdMenuBook />}
              />
              <Tab 
                value="bot"
                tabTitle='Robô Whatsapp'
                icon={<FaRobot />}
              />
            </>
            )}
        </RadixTabs.List>
        </div>
      </IconContext.Provider>
    </RadixTabs.Root>
  )
}

root.render(<Tabs />)