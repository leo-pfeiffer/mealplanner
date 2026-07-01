<template>
    <div id="app" class="flex flex-col min-h-screen text-amber-700 font-comic-sans">

        <div class="p-4">
            <div class="px-2 py-2 bg-white border border-amber-200 rounded-lg shadow">
                <div class="flex flex-row py-2 items-center">
                    <div class="min-w-16 mx-4">
                        <img src="@/assets/img/logo.png" alt="Logo" class="w-16 h-16"/>
                    </div>
                    <div class="py-1 px-2">
                        <NuxtLink to="/" class="bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                            Back
                        </NuxtLink>
                    </div>
                    <h1 class="text-xl font-semibold ml-4">Settings</h1>
                    <div class="py-1 px-2 ml-auto">
                        <NuxtLink to="/logout" class="inline-block bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                            Logout
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex-1 px-4 pb-4">
            <div class="p-6 bg-white border border-amber-200 rounded-lg shadow">

                <h2 class="text-lg font-semibold mb-4">Integrations</h2>

                <div class="border border-amber-200 rounded-lg p-4 max-w-md">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-semibold">Google Tasks</p>
                            <p class="text-sm mt-1" :class="googleConnected ? 'text-green-600' : 'text-gray-400'">
                                {{ googleConnected ? 'Connected' : 'Not connected' }}
                            </p>
                        </div>
                        <div>
                            <button
                                v-if="!googleConnected"
                                @click="connectGoogle"
                                :disabled="connecting"
                                class="bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded hover:cursor-pointer disabled:opacity-50">
                                {{ connecting ? 'Redirecting...' : 'Connect' }}
                            </button>
                            <button
                                v-else
                                @click="disconnectGoogle"
                                :disabled="disconnecting"
                                class="bg-transparent hover:bg-red-500 text-red-600 font-semibold hover:text-white py-1 px-4 border border-red-400 hover:border-transparent rounded hover:cursor-pointer disabled:opacity-50">
                                {{ disconnecting ? 'Disconnecting...' : 'Disconnect' }}
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="statusMessage" class="mt-4 max-w-md">
                    <p :class="statusMessage.type === 'success' ? 'text-green-600' : 'text-red-500'">
                        {{ statusMessage.text }}
                    </p>
                </div>

            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

definePageMeta({
    middleware: 'auth'
});

const { status, startConnect, disconnect } = useGoogleTasks();

const googleConnected = ref(false);
const connecting = ref(false);
const disconnecting = ref(false);
const statusMessage = ref(null);

const setMessage = (text, type = 'success', ms = 6000) => {
    statusMessage.value = { text, type };
    setTimeout(() => { statusMessage.value = null; }, ms);
};

onMounted(async () => {
    const route = useRoute();

    if (route.query.google === 'connected') {
        setMessage('Google account connected successfully!');
    } else if (route.query.google === 'error') {
        setMessage('Failed to connect Google account. Please try again.', 'error');
    }

    try {
        const { connected } = await status();
        googleConnected.value = connected;
    } catch {
        // If status check fails the user can still try to connect
    }
});

const connectGoogle = async () => {
    connecting.value = true;
    try {
        await startConnect();
    } catch {
        setMessage('Could not start Google authorization. Please try again.', 'error');
        connecting.value = false;
    }
};

const disconnectGoogle = async () => {
    disconnecting.value = true;
    try {
        await disconnect();
        googleConnected.value = false;
        setMessage('Google account disconnected.');
    } catch {
        setMessage('Could not disconnect Google account. Please try again.', 'error');
    } finally {
        disconnecting.value = false;
    }
};
</script>

<style>
#app {
    background-color: #fdf6e3;
    background-image:
        linear-gradient(to bottom, transparent 1.9em, #dcdcdc 2em),
        linear-gradient(to right, #ff6347 0.5em, transparent 0.5em);
    background-size: 100% 2em, 100% 100%;
    margin: 0;
    font-family: Arial, sans-serif;
}
</style>
