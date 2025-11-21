import { useState, useCallback } from 'react';

export const useHistory = <T,>(initialState: T) => {
    const [history, setHistory] = useState<T[]>([initialState]);
    const [pointer, setPointer] = useState(0);

    const setState = useCallback((newState: T | ((prevState: T) => T)) => {
        setHistory(prevHistory => {
            const resolvedState = typeof newState === 'function' ? (newState as (prevState: T) => T)(prevHistory[pointer]) : newState;
            if (JSON.stringify(resolvedState) === JSON.stringify(prevHistory[pointer])) {
                return prevHistory;
            }
            const newHistory = prevHistory.slice(0, pointer + 1);
            newHistory.push(resolvedState);
            return newHistory;
        });
        setPointer(prevPointer => prevPointer + 1);
    }, [pointer]);
    
    const undo = useCallback(() => {
        if (pointer > 0) {
            setPointer(p => p - 1);
        }
    }, [pointer]);

    const redo = useCallback(() => {
        if (pointer < history.length - 1) {
            setPointer(p => p + 1);
        }
    }, [pointer, history.length]);

    const canUndo = pointer > 0;
    const canRedo = pointer < history.length - 1;
    
    const resetHistory = useCallback((state: T) => {
        setHistory([state]);
        setPointer(0);
    }, []);

    return {
        state: history[pointer],
        setState,
        undo,
        redo,
        canUndo,
        canRedo,
        resetHistory,
    };
};