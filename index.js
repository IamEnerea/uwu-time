const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// IDs DE TUS CANALES
const CANAL_FICHAJE_ID = "1464800605892640769";
const CANAL_LOGS_ID = "1465075808128209168";

// Guardamos turnos activos (userId -> timestamp)
const turnos = new Map();

// 🕒 HORA GUATEMALA
function horaLocal() {
  return new Date().toLocaleString("es-GT", {
    timeZone: "America/Guatemala",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

client.once(Events.ClientReady, async () => {
  console.log(`☕🎀 UWU Time está online como ${client.user.tag}`);

  const canalFichaje = await client.channels.fetch(CANAL_FICHAJE_ID);

  // Evitar duplicar el mensaje de botones
  const mensajes = await canalFichaje.messages.fetch({ limit: 10 });
  const yaExiste = mensajes.some(
    m => m.author.id === client.user.id && m.components.length > 0
  );

  if (!yaExiste) {
    const embed = new EmbedBuilder()
      .setTitle("Uwu Café ☕🎀")
      .setDescription(
        "**Registro de horario 🩷**\n\n" +
        "Para mantener todo en orden en nuestro local ✨\n" +
        "Les pedimos que fichen aquí su horario cada vez que:\n\n" +
        "🧁 **Inicien su turno**\n" +
        "🍰 **Finalicen su jornada**\n\n" +
        "Así podremos llevar un mejor control y brindar siempre la mejor atención 💖\n" +
        "¡Gracias por su dedicación! 🧸"
      )
      .setColor(0xF6A5C0);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start_shift")
        .setLabel("🧁 Iniciar su turno")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("end_shift")
        .setLabel("🍰 Finalizar su jornada")
        .setStyle(ButtonStyle.Danger)
    );

    await canalFichaje.send({ embeds: [embed], components: [row] });
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const canalLogs = await client.channels.fetch(CANAL_LOGS_ID);
  const ahora = horaLocal();

  // 🧁 INICIAR TURNO
  if (interaction.customId === "start_shift") {
    if (turnos.has(interaction.user.id)) {
      return interaction.reply({
        content: "🧸 Ya tienes un turno activo 🍬",
        ephemeral: true
      });
    }

    turnos.set(interaction.user.id, Date.now());

    await canalLogs.send(
      `🧁 **${interaction.user.username}** inició su turno — ${ahora}\n` +
      `**Uwu Café ☕🎀**`
    );

    return interaction.reply({
      content: "🧁 Tu turno ha sido registrado correctamente 💖",
      ephemeral: true
    });
  }

  // 🍰 FINALIZAR JORNADA
  if (interaction.customId === "end_shift") {
    if (!turnos.has(interaction.user.id)) {
      return interaction.reply({
        content: "🍰 No tienes un turno activo para finalizar 🧸",
        ephemeral: true
      });
    }

    turnos.delete(interaction.user.id);

    await canalLogs.send(
      `🍰 **${interaction.user.username}** finalizó su jornada — ${ahora}\n` +
      `**Uwu Café ☕🎀**`
    );

    return interaction.reply({
      content: "🍰 Tu jornada ha sido cerrada con éxito 🌸",
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
