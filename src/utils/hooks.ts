// Utility hooks for performance optimization

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Debounce hook - delays update until user stops typing
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

/**
 * Debounced callback - for functions that should not run too often
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const callbackRef = useRef(callback)
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    const debouncedCallback = useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args)
        }, delay)
    }, [delay]) as T

    return debouncedCallback
}

/**
 * Throttle hook - limits how often a function can run
 */
export function useThrottle<T>(value: T, interval: number): T {
    const [throttledValue, setThrottledValue] = useState<T>(value)
    const lastExecuted = useRef<number>(Date.now())

    useEffect(() => {
        if (Date.now() >= lastExecuted.current + interval) {
            lastExecuted.current = Date.now()
            setThrottledValue(value)
        } else {
            const timerId = setTimeout(() => {
                lastExecuted.current = Date.now()
                setThrottledValue(value)
            }, interval)

            return () => clearTimeout(timerId)
        }
    }, [value, interval])

    return throttledValue
}
