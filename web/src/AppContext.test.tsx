import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { AppProvider, useApp } from './store/AppContext';
import { Entry } from "@shared/types';
import { Timestamp } from 'firebase/firestore';
import React, { ReactNode } from 'react';

// --- Mocks ---

// Use `vi.hoisted` to create mocks that can be referenced inside `vi.mock` factories.
// This is the recommended way to handle Vitest's hoisting behavior.
const { mockSyncEntryToCloud, mockDeleteEntryFromCloud, mockListenToEntries } = vi.hoisted(() => {
    return {
        mockSyncEntryToCloud: vi.fn(),
        mockDeleteEntryFromCloud: vi.fn(),
        // The mock for listenToEntries must return a mock unsubscribe function.
        mockListenToEntries: vi.fn(() => () => vi.fn()),
    };
});

// Mock Firebase Auth to simulate a logged-in user state.
vi.mock('firebase/auth', () => ({
    onAuthStateChanged: vi.fn((auth, callback) => {
        const mockUser = { uid: 'test-uid', displayName: 'Test User' };
        // Invoke the callback immediately with a mock user.
        callback(mockUser);
        // Return a mock unsubscribe function.
        return () => vi.fn();
    }),
    getAuth: vi.fn(() => ({
        currentUser: { uid: 'test-uid', displayName: 'Test User' },
    })),
    // Mock other auth functions to prevent runtime errors.
    signInWithPopup: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
}));

// Mock utility and service modules.
vi.mock('./src/utils/firebase', () => ({
    auth: {},
    googleProvider: {},
}));

vi.mock('./src/services/cloudService', () => ({
    uploadImageToCloud: vi.fn(),
    syncEntryToCloud: mockSyncEntryToCloud,
    deleteEntryFromCloud: mockDeleteEntryFromCloud,
    listenToEntries: mockListenToEntries,
}));

// --- Test Utilities ---

/**
 * Factory function to create mock Entry objects for clean and readable tests.
 * @param overrides - A partial Entry object to override default mock values.
 * @returns A complete mock Entry object.
 */
const createMockEntry = (overrides: Partial<Entry> = {}): Entry => ({
    id: `test-id-${Date.now()}`,
    timestamp: Date.now(),
    date: Timestamp.now(),
    itemName: 'Test Item',
    type: 'combined',
    category: 'food',
    paymentMethod: 'card',
    usage: 'need',
    cost: 10,
    calories: 100,
    protein: 10,
    carbs: 10,
    fat: 1,
    modeUsed: 'CONSERVATIVE',
    ...overrides,
});

/**
 * A "spy" component that captures the latest context value on every render.
 * This is crucial for asserting state changes after async operations.
 */
const TestContextSpy = ({ onUpdate }: { onUpdate: (app: any) => void }) => {
    const app = useApp();
    React.useEffect(() => {
        onUpdate(app);
    }); // No dependency array ensures this runs on every render.
    return null;
};

/**
 * Custom render function to abstract away the boilerplate of wrapping components
 * with AppProvider and the context spy.
 * @returns An object with the testing-library render result and a `getContext` function.
 */
const renderWithAppContext = async () => {
    let latestAppContext: any;

    const renderResult = render(
        <AppProvider>
            <TestContextSpy onUpdate={(app) => { latestAppContext = app; }} />
        </AppProvider>
    );

    // Wait for the context to be initialized (e.g., user auth state is set).
    await waitFor(() => expect(latestAppContext).toBeDefined());

    return {
        ...renderResult,
        // Use a getter to ensure tests always access the *latest* context value.
        getContext: () => latestAppContext,
    };
};


// --- Test Suite ---

describe('AppContext', () => {

    // Before each test, clear all mock call history to ensure test isolation.
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should add an entry and sync it to the cloud', async () => {
        // Arrange: Set up the test environment and create test data.
        const { getContext } = await renderWithAppContext();
        const newEntry = createMockEntry({ itemName: 'Espresso', cost: 3 });

        // Pre-condition Assert: Ensure the initial state is correct.
        expect(getContext().entries).toHaveLength(0);

        // Act: Perform the action to be tested.
        await act(async () => {
            await getContext().addEntry(newEntry);
        });

        // Assert: Verify the state has updated as expected.
        // We need to wait for the listener to fire and update the state
        await waitFor(() => {
            expect(mockListenToEntries).toHaveBeenCalled();
        });

        // To simulate the state update triggered by the Firestore listener,
        // we can directly call the callback function passed to our mock listener.
        await act(async () => {
            const listenerCallback = mockListenToEntries.mock.calls[0][1];
            listenerCallback([newEntry]);
        });
        
        const context = getContext();
        expect(context.entries).toHaveLength(1);
        expect(context.entries[0]).toEqual(expect.objectContaining({
            itemName: 'Espresso',
            cost: 3,
        }));

        // Assert Side-effects: Verify that the cloud sync function was called.
        expect(mockSyncEntryToCloud).toHaveBeenCalledWith(newEntry, 'test-uid');
        expect(mockSyncEntryToCloud).toHaveBeenCalledTimes(1);
    });
});
