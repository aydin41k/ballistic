import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: { sitekey: string; theme: 'auto' }) => string;
            remove: (widgetId: string) => void;
        };
    }
}

interface AccountVerificationProps {
    actionUrl: string;
    siteKey: string | null;
    channel: 'email' | 'sms';
}

export default function AccountVerification({ actionUrl, siteKey, channel }: AccountVerificationProps) {
    const widgetContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!siteKey || !widgetContainer.current) {
            return;
        }

        let widgetId: string | null = null;
        const renderWidget = () => {
            if (window.turnstile && widgetContainer.current && widgetContainer.current.childElementCount === 0) {
                widgetId = window.turnstile.render(widgetContainer.current, { sitekey: siteKey, theme: 'auto' });
            }
        };

        const existingScript = document.querySelector<HTMLScriptElement>('script[data-ballistic-turnstile]');
        if (existingScript) {
            if (window.turnstile) {
                renderWidget();
            } else {
                existingScript.addEventListener('load', renderWidget, { once: true });
            }
        } else {
            const script = document.createElement('script');
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            script.dataset.ballisticTurnstile = 'true';
            script.addEventListener('load', renderWidget, { once: true });
            document.head.appendChild(script);
        }

        return () => {
            if (widgetId && window.turnstile) {
                window.turnstile.remove(widgetId);
            }
        };
    }, [siteKey]);

    return (
        <AuthLayout
            title="One last check"
            description={`Your ${channel === 'sms' ? 'mobile number' : 'email address'} is confirmed. Prove you are human to activate your account.`}
        >
            <Head title="Verify account" />

            <Form action={actionUrl} method="post" className="space-y-5">
                {({ processing, errors }) => (
                    <>
                        <div className="flex justify-center text-blue-600">
                            <ShieldCheck className="size-10" aria-hidden="true" />
                        </div>

                        {siteKey ? (
                            <div ref={widgetContainer} className="flex min-h-16 justify-center" />
                        ) : (
                            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                                The human check is temporarily unavailable. Please try again later.
                            </p>
                        )}

                        {errors.human_check && <p className="text-center text-sm text-red-600">{errors.human_check}</p>}

                        <Button type="submit" className="w-full" disabled={processing || !siteKey}>
                            {processing && <LoaderCircle className="animate-spin" />}
                            Verify account
                        </Button>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
