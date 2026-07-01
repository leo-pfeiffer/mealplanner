export const useGoogleTasks = () => {
    const status = (): Promise<{ connected: boolean }> =>
        $fetch('/api/auth/google/status');

    const startConnect = async (): Promise<void> => {
        const { url } = await $fetch<{ url: string }>('/api/auth/google/authorize');
        window.location.href = url;
    };

    const disconnect = (): Promise<unknown> =>
        $fetch('/api/auth/google/disconnect', { method: 'POST' });

    const send = (mealplanId: number): Promise<unknown> =>
        $fetch(`/api/internal/google-tasks?mealplanId=${mealplanId}`, { method: 'POST' });

    return { status, startConnect, disconnect, send };
};
