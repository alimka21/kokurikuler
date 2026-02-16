
import React, { createContext, useContext } from 'react';
import { useProjectWizard } from '../hooks/useProjectWizard';
import { User } from '../types';

// Infers the return type from the hook automatically
type ProjectContextType = ReturnType<typeof useProjectWizard>;

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode; user: User }> = ({ children, user }) => {
    // Initialize the hook here. The state lives in this provider.
    const projectWizard = useProjectWizard(user);

    return (
        <ProjectContext.Provider value={projectWizard}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
