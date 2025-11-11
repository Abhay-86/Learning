import { useRouter } from 'next/navigation';

export function useRedirect() {
    const router = useRouter();

    const redirect = (path: string) => {
        router.push(path);
    };

    return { redirect };
}