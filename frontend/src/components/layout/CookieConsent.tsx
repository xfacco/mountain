'use client';

import { useEffect } from 'react';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import * as CookieConsent from 'vanilla-cookieconsent';

export default function CookieConsentComponent() {
    useEffect(() => {
        CookieConsent.run({
            guiOptions: {
                consentModal: {
                    layout: 'box',
                    position: 'bottom right',
                    equalWeightButtons: true,
                    flipButtons: false
                },
                preferencesModal: {
                    layout: 'box',
                    position: 'left',
                    equalWeightButtons: true,
                    flipButtons: false
                }
            },
            categories: {
                necessary: {
                    readOnly: true
                },
                analytics: {
                    services: {
                        googleAnalytics: {
                            label: 'Google Analytics',
                            onAccept: () => {
                                // @ts-ignore
                                window.gtag?.('consent', 'update', {
                                    'analytics_storage': 'granted'
                                });
                            },
                            onReject: () => {
                                // @ts-ignore
                                window.gtag?.('consent', 'update', {
                                    'analytics_storage': 'denied'
                                });
                            }
                        }
                    }
                }
            },
            language: {
                default: 'en',
                autoDetect: 'browser',
                translations: {
                    en: {
                        consentModal: {
                            title: "Hello traveller, it's cookie time!",
                            description: "Our website uses essential cookies to ensure its proper operation and tracking cookies to understand how you interact with it. The latter will be set only after consent.",
                            acceptAllBtn: 'Accept all',
                            acceptNecessaryBtn: 'Reject all',
                            showPreferencesBtn: 'Manage preferences',
                            footer: `
                                <a href="/privacy" class="cc__link">Privacy Policy</a>
                                <a href="/terms" class="cc__link">Terms and conditions</a>
                            `
                        },
                        preferencesModal: {
                            title: 'Cookie preferences',
                            acceptAllBtn: 'Accept all',
                            acceptNecessaryBtn: 'Reject all',
                            savePreferencesBtn: 'Save settings',
                            closeIconLabel: 'Close modal',
                            serviceCounterLabel: 'Service|Services',
                            sections: [
                                {
                                    title: 'Cookie usage',
                                    description: 'I use cookies to ensure the basic functionalities of the website and to enhance your online experience. You can choose for each category to opt-in/out whenever you want. For more details relative to cookies and other sensitive data, please read the full <a href="/privacy" class="cc__link">privacy policy</a>.'
                                },
                                {
                                    title: 'Strictly necessary cookies',
                                    description: 'These cookies are essential for the proper functioning of my website. Without these cookies, the website would not work properly',
                                    linkedCategory: 'necessary'
                                },
                                {
                                    title: 'Performance and Analytics cookies',
                                    description: 'These cookies allow the website to remember the choices you have made in the past',
                                    linkedCategory: 'analytics'
                                },
                                {
                                    title: 'More information',
                                    description: 'For any queries in relation to my policy on cookies and your choices, please <a class="cc__link" href="/contact">contact us</a>.',
                                }
                            ]
                        }
                    },
                    it: {
                        consentModal: {
                            title: "Ciao viaggiatore, è l'ora dei cookie!",
                            description: "Il nostro sito utilizza cookie essenziali per garantirne il corretto funzionamento e cookie di tracciamento per capire come interagisci con esso. Questi ultimi verranno impostati solo previo consenso.",
                            acceptAllBtn: 'Accetta tutti',
                            acceptNecessaryBtn: 'Rifiuta tutti',
                            showPreferencesBtn: 'Gestisci preferenze',
                            footer: `
                                <a href="/privacy" class="cc__link">Privacy Policy</a>
                                <a href="/terms" class="cc__link">Termini e condizioni</a>
                            `
                        },
                        preferencesModal: {
                            title: 'Preferenze Cookie',
                            acceptAllBtn: 'Accetta tutti',
                            acceptNecessaryBtn: 'Rifiuta tutti',
                            savePreferencesBtn: 'Salva impostazioni',
                            closeIconLabel: 'Chiudi',
                            serviceCounterLabel: 'Servizio|Servizi',
                            sections: [
                                {
                                    title: 'Utilizzo dei Cookie',
                                    description: 'Utilizziamo i cookie per garantire le funzionalità di base del sito e per migliorare la tua esperienza online. Puoi scegliere per ogni categoria se accettare o meno in qualsiasi momento. Per maggiori dettagli relativi ai cookie e ad altri dati sensibili, leggi la <a href="/privacy" class="cc__link">privacy policy</a> completa.'
                                },
                                {
                                    title: 'Cookie Strettamente Necessari',
                                    description: 'Questi cookie sono essenziali per il corretto funzionamento del sito. Senza questi cookie, il sito non funzionerebbe correttamente.',
                                    linkedCategory: 'necessary'
                                },
                                {
                                    title: 'Cookie di Performance e Analisi',
                                    description: 'Questi cookie permettono al sito di ricordare le scelte fatte in passato e di analizzare il traffico.',
                                    linkedCategory: 'analytics'
                                },
                                {
                                    title: 'Maggiori Informazioni',
                                    description: 'Per qualsiasi domanda relativa alla nostra politica sui cookie e alle tue scelte, <a class="cc__link" href="/contact">contattaci</a>.',
                                }
                            ]
                        }
                    }
                }
            }
        });

        // Expose to window for external access
        // @ts-ignore
        window.CookieConsent = CookieConsent;
    }, []);

    return null;
}
