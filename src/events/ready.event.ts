import { ActivityType, Client, Events, PresenceUpdateStatus } from 'discord.js';
import { SlashCommandLoader } from '@/core/loaders/slash-command.loader';
import { logger } from '@/utils/Logger';

const log = logger.child('Ready');

/**
 * Evento Ready - Se ejecuta cuando el bot se conecta exitosamente a Discord
 *
 * IMPORTANTE sobre Intents y Presencias:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * ❌ NO necesitas el intent "GatewayIntentBits.GuildPresences" para:
 *    - Establecer la presencia de TU bot (setPresence)
 *    - Cambiar el estado de tu bot
 *    - Mostrar actividades personalizadas
 *
 * ✅ SÍ necesitas el intent "GatewayIntentBits.GuildPresences" para:
 *    - LEER las presencias de otros usuarios/bots
 *    - Detectar cuando un usuario cambia su estado
 *    - Acceder a información de actividades de otros miembros
 *
 * Para este template, NO es necesario añadir ese intent.
 */
export function registerReadyEvent(slashCommandLoader: SlashCommandLoader) {
    return {
        name: Events.ClientReady,
        once: true,
        async execute(client: Client) {
            // client.shard es null en modo single-instance y ShardClientUtil en modo sharding.
            // ids[0] identifica el shard de este proceso; sin sharding se trata como shard 0.
            const shardId = client.shard?.ids[0] ?? 0;
            const shardLabel = client.shard ? ` [Shard ${shardId}]` : '';
            log.info(`Bot conectado como ${client.user?.tag}${shardLabel}`);

            // Los slash commands se registran una sola vez desde el shard 0.
            // En modo single-instance (shardId=0 por defecto) siempre se registran.
            if (shardId === 0) {
                await slashCommandLoader.registerSlashCommands();
            }

            // Establecer presencia personalizada (Custom Status)
            // Nota: Para presencias personalizadas, NO se necesita el intent de Presences
            // Solo se necesita para LEER presencias de otros usuarios
            setCustomPresence(client);
        },
    };
}

/**
 * Establece una presencia personalizada para el bot
 *
 * Tipos de actividad disponibles:
 * - ActivityType.Playing: "Jugando a {nombre}"
 * - ActivityType.Streaming: "En directo {nombre}"
 * - ActivityType.Listening: "Escuchando {nombre}"
 * - ActivityType.Watching: "Viendo {nombre}"
 * - ActivityType.Competing: "Compitiendo en {nombre}"
 * - ActivityType.Custom: Estado personalizado (como "😎 Siendo increíble")
 *
 * Estados disponibles:
 * - PresenceUpdateStatus.Online: En línea (verde)
 * - PresenceUpdateStatus.Idle: Ausente (amarillo)
 * - PresenceUpdateStatus.DoNotDisturb: No molestar (rojo)
 * - PresenceUpdateStatus.Invisible: Invisible
 */
function setCustomPresence(client: Client): void {
    try {
        // Ejemplo 1: Estado Custom simple
        client.user?.setPresence({
            activities: [
                {
                    name: '🦆 Patto el Ayudantte',
                    type: ActivityType.Custom,
                },
            ],
            status: PresenceUpdateStatus.Online,
        });

        // Ejemplo 2: Estado "Jugando a..."
        // client.user?.setPresence({
        //     activities: [
        //         {
        //             name: 'con comandos',
        //             type: ActivityType.Playing,
        //         },
        //     ],
        //     status: PresenceUpdateStatus.Online,
        // });

        // Ejemplo 3: Estado "Escuchando..."
        // client.user?.setPresence({
        //     activities: [
        //         {
        //             name: '/help para comandos',
        //             type: ActivityType.Listening,
        //         },
        //     ],
        //     status: PresenceUpdateStatus.Online,
        // });

        // Ejemplo 4: Estado "Viendo..."
        // client.user?.setPresence({
        //     activities: [
        //         {
        //             name: 'a los usuarios',
        //             type: ActivityType.Watching,
        //         },
        //     ],
        //     status: PresenceUpdateStatus.DoNotDisturb,
        // });

        // Ejemplo 5: Estado con URL de streaming (solo funciona con Twitch/YouTube)
        // client.user?.setPresence({
        //     activities: [
        //         {
        //             name: 'Mi Stream',
        //             type: ActivityType.Streaming,
        //             url: 'https://www.twitch.tv/tu_canal',
        //         },
        //     ],
        //     status: PresenceUpdateStatus.Online,
        // });

        // Ejemplo 6: Presencia rotativa (cambia cada X segundos)
        // const presences = [
        //     { name: '🎮 Jugando', type: ActivityType.Playing },
        //     { name: '👀 Observando', type: ActivityType.Watching },
        //     { name: '🎵 Música', type: ActivityType.Listening },
        // ];
        //
        // let currentIndex = 0;
        // setInterval(() => {
        //     const presence = presences[currentIndex];
        //     client.user?.setPresence({
        //         activities: [presence],
        //         status: PresenceUpdateStatus.Online,
        //     });
        //     currentIndex = (currentIndex + 1) % presences.length;
        // }, 10000); // Cambia cada 10 segundos

        log.info('Presencia personalizada establecida');
    } catch (error) {
        log.error('Error al establecer presencia', error);
    }
}
