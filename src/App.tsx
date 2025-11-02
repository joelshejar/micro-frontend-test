import { Suspense, lazy } from 'react';

// Load remote components from remote1
const RemoteApp = lazy(() => import('remote1/App'));
const RemoteButton = lazy(() => import('remote1/Button'));

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Micro-Frontend Host</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Module Federation with Rspack
          </p>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Welcome to the Host Application</h2>
            <p className="text-muted-foreground">
              This is the main host application built with React, Rspack, and Module Federation.
              Remote micro-frontends will be loaded dynamically here.
            </p>
          </div>

          <div className="border rounded-lg p-4 space-y-2">
            <h3 className="font-semibold">Getting Started</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Create your remote applications in separate repositories</li>
              <li>Configure Module Federation in each remote app</li>
              <li>Update rspack.config.ts remotes section with remote URLs</li>
              <li>Import and use remote components with lazy loading</li>
            </ol>
          </div>

          {/* Remote Button Component */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Remote Button from Remote1</h3>
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading remote button...</div>}>
              <RemoteButton />
            </Suspense>
          </div>

          {/* Remote App Component */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Remote Application (Remote1)</h3>
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading remote app...</div>}>
              <RemoteApp />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
