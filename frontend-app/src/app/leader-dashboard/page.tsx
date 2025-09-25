"use client";

import React from 'react';
import withAuth from '../../lib/withAuth';
import { Role } from '../../common/types';

const LeaderDashboardPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Leader Dashboard</h1>
    </div>
  );
};

export default withAuth(LeaderDashboardPage, { allowedRoles: [Role.LEADER] });
