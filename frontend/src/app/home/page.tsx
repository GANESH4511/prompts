'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Project {
    id: string;
    name: string;
    path: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface DirectoryItem {
    name: string;
    path: string;
}

export default function HomePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewProject, setShowNewProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [selectedPath, setSelectedPath] = useState('');
    const [browsing, setBrowsing] = useState(false);
    const [currentBrowsePath, setCurrentBrowsePath] = useState('C:/');
    const [directories, setDirectories] = useState<DirectoryItem[]>([]);
    const [browseLoading, setBrowseLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (user) {
            fetchProjects();
        }
    }, [user]);

    const checkAuth = () => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('authToken');

        if (!storedUser || !token) {
            router.push('/login');
            return;
        }

        try {
            setUser(JSON.parse(storedUser));
        } catch {
            router.push('/login');
        }
        setLoading(false);
    };

    const fetchProjects = async () => {
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/api/projects/user/${user.id}`);
            const data = await response.json();

            if (data.success) {
                setProjects(data.projects);
                // If no projects, show the new project form
                if (data.projects.length === 0) {
                    setShowNewProject(true);
                }
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
        }
    };

    const browseDirectory = async (path: string) => {
        setBrowseLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/projects/browse?path=${encodeURIComponent(path)}`);
            const data = await response.json();

            if (data.success) {
                setCurrentBrowsePath(data.currentPath);
                setDirectories(data.directories);
            }
        } catch (err) {
            console.error('Error browsing directory:', err);
        } finally {
            setBrowseLoading(false);
        }
    };

    const openBrowser = () => {
        setBrowsing(true);
        browseDirectory(currentBrowsePath);
    };

    const selectDirectory = (path: string) => {
        setSelectedPath(path);
        setBrowsing(false);
        // Auto-fill project name if empty
        if (!newProjectName) {
            const folderName = path.split('/').pop() || 'New Project';
            setNewProjectName(folderName.charAt(0).toUpperCase() + folderName.slice(1));
        }
    };

    const createProject = async () => {
        if (!user || !newProjectName || !selectedPath) return;

        setCreating(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    name: newProjectName,
                    path: selectedPath,
                    description: newProjectDescription
                })
            });

            const data = await response.json();

            if (data.success) {
                setShowNewProject(false);
                setNewProjectName('');
                setNewProjectDescription('');
                setSelectedPath('');
                await fetchProjects();
                // Navigate to the main app
                router.push('/');
            } else {
                setError(data.message || 'Failed to create project');
            }
        } catch (err) {
            console.error('Error creating project:', err);
            setError('Failed to create project. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const activateProject = async (projectId: string) => {
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/api/projects/${projectId}/activate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            const data = await response.json();

            if (data.success) {
                await fetchProjects();
                // Navigate to the main app
                router.push('/');
            }
        } catch (err) {
            console.error('Error activating project:', err);
        }
    };

    const deleteProject = async (projectId: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                await fetchProjects();
            }
        } catch (err) {
            console.error('Error deleting project:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative z-10 p-8">
                {/* Header */}
                <header className="max-w-6xl mx-auto mb-10 glass-panel rounded-2xl p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Project Hub
                            </h1>
                            <p className="text-sm text-gray-400">Welcome back, {user?.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowNewProject(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            New Project
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto">
                    {/* New Project Modal */}
                    {showNewProject && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                            <div className="w-full max-w-2xl glass-panel rounded-3xl p-8 animate-pulse-glow">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white">
                                        {projects.length === 0 ? 'Create Your First Project' : 'New Project'}
                                    </h2>
                                    {projects.length > 0 && (
                                        <button
                                            onClick={() => setShowNewProject(false)}
                                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors text-xl"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {/* Project Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Project Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newProjectName}
                                            onChange={(e) => setNewProjectName(e.target.value)}
                                            placeholder="My Awesome Project"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        />
                                    </div>

                                    {/* Project Path */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Project Folder
                                        </label>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={selectedPath}
                                                onChange={(e) => setSelectedPath(e.target.value)}
                                                placeholder="C:/path/to/your/project"
                                                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm"
                                            />
                                            <button
                                                onClick={openBrowser}
                                                className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                </svg>
                                                Browse
                                            </button>
                                        </div>
                                    </div>

                                    {/* Directory Browser */}
                                    {browsing && (
                                        <div className="bg-black/30 rounded-xl border border-white/10 overflow-hidden">
                                            <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                                                    <span>📂</span>
                                                    <span>{currentBrowsePath}</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const parent = currentBrowsePath.split('/').slice(0, -1).join('/') || 'C:/';
                                                        browseDirectory(parent);
                                                    }}
                                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
                                                >
                                                    ⬆️ Up
                                                </button>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto p-2">
                                                {browseLoading ? (
                                                    <div className="flex justify-center py-8">
                                                        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                                                    </div>
                                                ) : directories.length === 0 ? (
                                                    <div className="text-center py-8 text-gray-500">
                                                        No subdirectories found
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        {directories.map((dir) => (
                                                            <div
                                                                key={dir.path}
                                                                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                                                            >
                                                                <button
                                                                    onClick={() => browseDirectory(dir.path)}
                                                                    className="flex items-center gap-3 flex-1 text-left"
                                                                >
                                                                    <span className="text-lg">📁</span>
                                                                    <span className="text-gray-300 group-hover:text-white transition-colors">
                                                                        {dir.name}
                                                                    </span>
                                                                </button>
                                                                <button
                                                                    onClick={() => selectDirectory(dir.path)}
                                                                    className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all"
                                                                >
                                                                    Select
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3 bg-white/5 border-t border-white/10 flex justify-between">
                                                <button
                                                    onClick={() => selectDirectory(currentBrowsePath)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors"
                                                >
                                                    Select Current Folder
                                                </button>
                                                <button
                                                    onClick={() => setBrowsing(false)}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Description (optional)
                                        </label>
                                        <textarea
                                            value={newProjectDescription}
                                            onChange={(e) => setNewProjectDescription(e.target.value)}
                                            placeholder="Brief description of your project..."
                                            rows={3}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={createProject}
                                        disabled={!newProjectName || !selectedPath || creating}
                                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-lg transition-all shadow-lg shadow-indigo-500/25"
                                    >
                                        {creating ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Creating...
                                            </span>
                                        ) : (
                                            'Create Project'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Projects Grid */}
                    {projects.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">Your Projects</h2>
                                <span className="text-sm text-gray-400">{projects.length} project(s)</span>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project) => (
                                    <div
                                        key={project.id}
                                        className={`glass-card rounded-2xl p-6 transition-all cursor-pointer group ${project.isActive
                                                ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/20'
                                                : 'hover:ring-1 hover:ring-white/20'
                                            }`}
                                        onClick={() => activateProject(project.id)}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${project.isActive
                                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                                    : 'bg-white/5'
                                                }`}>
                                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                </svg>
                                            </div>
                                            {project.isActive && (
                                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                                                    Active
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                                            {project.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 font-mono mb-3 truncate" title={project.path}>
                                            {project.path}
                                        </p>
                                        {project.description && (
                                            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                                {project.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                            <span className="text-xs text-gray-500">
                                                Updated {new Date(project.updatedAt).toLocaleDateString()}
                                            </span>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteProject(project.id);
                                                    }}
                                                    className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                                                    title="Delete project"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add New Project Card */}
                                <button
                                    onClick={() => setShowNewProject(true)}
                                    className="glass-card rounded-2xl p-6 border-2 border-dashed border-white/10 hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center min-h-[200px] group"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center mb-4 transition-colors">
                                        <svg className="w-7 h-7 text-gray-500 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-500 group-hover:text-indigo-400 font-medium transition-colors">
                                        Add New Project
                                    </span>
                                </button>
                            </div>
                        </div>
                    ) : !showNewProject && (
                        <div className="text-center py-20 glass-panel rounded-3xl">
                            <div className="text-6xl mb-6 opacity-50">📂</div>
                            <h2 className="text-2xl font-bold text-white mb-4">No Projects Yet</h2>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto">
                                Get started by creating your first project. Select a folder containing your prompt files.
                            </p>
                            <button
                                onClick={() => setShowNewProject(true)}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all"
                            >
                                Create First Project
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
