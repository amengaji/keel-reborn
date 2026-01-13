import React from 'react';
import { Construction } from 'lucide-react';

const PageComponent: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Under Construction</h1>
        <p className="text-muted-foreground text-sm">Module in development.</p>
      </div>
      <div className="flex flex-col items-center justify-center h-96 bg-card rounded-xl border border-dashed border-border shadow-sm">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Construction className="text-muted-foreground" size={32} />
        </div>
        <h3 className="text-lg font-medium text-foreground">Coming Soon</h3>
        <p className="text-muted-foreground text-sm mt-1">
           Waiting for data integration.
        </p>
      </div>
    </div>
  );
};

export default PageComponent;