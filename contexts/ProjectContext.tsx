// DEPRECATED: Use store/projectStore.ts instead.
// This file is kept temporarily to avoid immediate import breakages during refactor,
// but should be removed once full migration is confirmed.

import React from 'react';
export const ProjectContext = React.createContext<any>(undefined);
export const ProjectProvider: React.FC<any> = ({ children }) => <>{children}</>;
export const useProject = () => { throw new Error("useProject is deprecated. Use useProjectStore."); };
