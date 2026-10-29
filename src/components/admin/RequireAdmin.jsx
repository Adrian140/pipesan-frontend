import React from 'react';
import ProtectedRoute from '../ProtectedRoute';
export default function RequireAdmin({children}){return <ProtectedRoute admin>{children}</ProtectedRoute>;}
