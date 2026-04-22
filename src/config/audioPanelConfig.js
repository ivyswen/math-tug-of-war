export const audioPanelConfig = {
  storageKey: 'edugames.tugofwar.settings.v1',
  selectedField: 'selectedAudioId',
  defaultAudioId: 'audio',
  audioElementId: 'backgroundMusic',
  audios: [
    {
      id: 'audio',
      file: 'audio.mp3',
      label: 'Standart kuy',
      description: 'Hozirgi klassik fon musiqasi, sokin va darsga mos ritm bilan.',
      accent: '#2563eb',
      src: '/game/assets/audio/audio.mp3',
    },
    {
      id: 'audio-1',
      file: 'audio-1.mp3',
      label: 'Energiya kuy',
      description: 'Musobaqa kayfiyatini oshiradigan biroz jonliroq variant.',
      accent: '#059669',
      src: '/game/assets/audio/audio-1.mp3',
    },
  ],
};
