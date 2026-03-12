'use client';

import { useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import cn from 'classnames';

import s from './SideBar.module.scss';

import iconReports from '../../assets/reports.svg';
import iconReportsActive from '../../assets/reports-active.svg';
import iconBreaksReport from '../../assets/breaks-report.svg';
import iconBreaksReportActive from '../../assets/breaks-report-active.svg';
import iconAttendanceReport from '../../assets/attendance-report.svg';
import iconAttendanceReportActive from '../../assets/attendance-report-active.svg';
import iconDeposits from '../../assets/deposits.svg';
import iconDepositsActive from '../../assets/deposits-active.svg';
import iconLead from '../../assets/lead.svg';
import iconLeadActive from '../../assets/lead-active.svg';
import iconUsers from '../../assets/users.svg';
import iconUsersActive from '../../assets/users-active.svg';
import iconTeams from '../../assets/teams.svg';
import iconTeamsActive from '../../assets/teams-active.svg';
import iconAffilator from '../../assets/affilator.svg';
import iconAffilatorActive from '../../assets/affilator-active.svg';
import iconSchedule from '../../assets/schedule.svg';
import iconScheduleActive from '../../assets/schedule-active.svg';

import { useAuthStore } from '@/features/auth/store/authStore';
import { Role } from '@/features/auth/types';
import { SidebarDepositProgress } from '@/widgets/side-bar/ui/SideBarDepositProgress';

const SIDEBAR_WIDTH = 200;
const EDGE_THRESHOLD = 24;
const TOP_OFFSET = 20;

/** Set to true after placing PNG sprites in public/sidebar-icons/ (see README there). */
const USE_SIDEBAR_PNG_SPRITES = false;

export function SideBar() {
  const pathname = usePathname();
  const { employee } = useAuthStore();
  const [isOpen, setIsOpen] = useState(true);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const touchStart = useRef<{ x: number; y: number; startOffset: number } | null>(null);
  const dragCommitted = useRef(false);

  const isDragging = dragOffset !== null;
  const translateX = dragOffset ?? (isOpen ? 0 : -SIDEBAR_WIDTH);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    if (x > EDGE_THRESHOLD && x < SIDEBAR_WIDTH + 20) {
      const startOffset = isOpen ? 0 : -SIDEBAR_WIDTH;
      touchStart.current = { x, y, startOffset };
      dragCommitted.current = false;
    } else if (x <= EDGE_THRESHOLD) {
      const startOffset = isOpen ? 0 : -SIDEBAR_WIDTH;
      touchStart.current = { x, y, startOffset };
      dragCommitted.current = false;
    }
  }, [isOpen]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const deltaX = x - touchStart.current.x;
    const deltaY = y - touchStart.current.y;
    if (!dragCommitted.current) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absY > absX) {
        touchStart.current = null;
        return;
      }
      dragCommitted.current = true;
    }
    let next = touchStart.current.startOffset + deltaX;
    next = Math.min(0, Math.max(-SIDEBAR_WIDTH, next));
    setDragOffset(next);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current) return;
    const current = dragOffset ?? (isOpen ? 0 : -SIDEBAR_WIDTH);
    const threshold = -SIDEBAR_WIDTH / 2;
    setIsOpen(current > threshold);
    setDragOffset(null);
    touchStart.current = null;
    dragCommitted.current = false;
  }, [dragOffset, isOpen]);

  const handleTouchCancel = useCallback(() => {
    setDragOffset(null);
    touchStart.current = null;
  }, []);

  if (!employee) return null;

  const linkList = [
    {
      id: 1,
      title: 'Reports',
      href: '/reports',
      spriteKey: 'reports',
      icon: iconReports,
      iconActive: iconReportsActive,
      roles: [Role.ADMIN, Role.SUPER_ADMIN],
    },
    {
      id: 6,
      title: 'Breaks Report',
      href: '/breaks-report',
      spriteKey: 'breaks-report',
      icon: iconBreaksReport,
      iconActive: iconBreaksReportActive,
      roles: [Role.ADMIN, Role.SUPER_ADMIN],
    },
    {
      id: 7,
      title: 'Attendance Report',
      href: '/attendance-report',
      spriteKey: 'attendance-report',
      icon: iconAttendanceReport,
      iconActive: iconAttendanceReportActive,
      roles: [Role.ADMIN, Role.SUPER_ADMIN],
    },
    {
      id: 9,
      title: 'Deposits',
      href: '/deposits',
      spriteKey: 'deposits',
      icon: iconDeposits,
      iconActive: iconDepositsActive,
      roles: [Role.ADMIN, Role.SUPER_ADMIN, Role.TEAMLEADER, Role.AGENT],
    },
    {
      id: 2,
      title: 'Leads',
      href: '/leads',
      spriteKey: 'leads',
      icon: iconLead,
      iconActive: iconLeadActive,
      roles: [Role.ADMIN, Role.SUPER_ADMIN, Role.LEADMANAGER, Role.TEAMLEADER, Role.AGENT],
    },
    {
      id: 11,
      title: 'Reminders',
      href: '/schedules',
      spriteKey: 'schedule',
      icon: iconSchedule,
      iconActive: iconScheduleActive,
      roles: [Role.ADMIN, Role.SUPER_ADMIN, Role.LEADMANAGER, Role.TEAMLEADER, Role.AGENT],
    },
    {
      id: 4,
      title: 'Employees',
      href: '/employees',
      spriteKey: 'employees',
      icon: iconUsers,
      iconActive: iconUsersActive,
      roles: [Role.ADMIN, Role.SUPER_ADMIN, Role.LEADMANAGER],
    },
    {
      id: 8,
      title: 'Desks',
      href: '/teams',
      spriteKey: 'teams',
      icon: iconTeams,
      iconActive: iconTeamsActive,
      roles: [Role.ADMIN, Role.SUPER_ADMIN, Role.LEADMANAGER, Role.TEAMLEADER],
    },
    {
      id: 5,
      title: 'Affiliator',
      href: '/affiliator',
      spriteKey: 'affiliator',
      icon: iconAffilator,
      iconActive: iconAffilatorActive,
      roles: [Role.ADMIN, Role.SUPER_ADMIN, Role.LEADMANAGER],
    },
  ];

  // Filter links by current user role
  const visibleLinks = linkList.filter(link => link.roles.includes(employee.role));

  return (
    <>
      {/* Swipe zone: opens sidebar when touching the left edge */}
      <div
        className={s.SideBar__edge}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        aria-hidden
      />
      <div
        className={s.SideBar}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease-out',
          top: TOP_OFFSET,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div className={s.SideBar__content}>
          <div className={s.SideBar__logo}></div>

          <SidebarDepositProgress />

          <div className={s.SideBar__list}>
          {visibleLinks.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(s.SideBar__link, {
                  [s.SideBar__link_active]: isActive,
                })}
              >
                {'spriteKey' in item && item.spriteKey && USE_SIDEBAR_PNG_SPRITES ? (
                  <span
                    className={s.SideBar__iconSprite}
                    style={{
                      backgroundImage: `url(/sidebar-icons/${item.spriteKey}.png)`,
                      backgroundPosition: isActive ? '-20px 0' : '0 0',
                    }}
                    aria-hidden
                  />
                ) : (
                  <Image
                    src={isActive ? item.iconActive : item.icon}
                    width={20}
                    height={20}
                    alt={item.title}
                  />
                )}
                <span>{item.title}</span>
              </Link>
            );
          })}
          </div>
        </div>
      </div>
    </>
  );
}