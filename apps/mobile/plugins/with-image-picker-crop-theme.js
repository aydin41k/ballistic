const {
  AndroidConfig,
  withAndroidColors,
  withAndroidColorsNight,
  withStringsXml,
} = require('expo/config-plugins');

const cropColours = {
  expoCropToolbarColor: '#0A2540',
  expoCropToolbarIconColor: '#FFFFFF',
  expoCropToolbarActionTextColor: '#FFFFFF',
  expoCropBackButtonIconColor: '#FFFFFF',
  expoCropBackgroundColor: '#000000',
};

function withCropColours(config, colourMod) {
  return colourMod(config, (modConfig) => {
    for (const [name, value] of Object.entries(cropColours)) {
      modConfig.modResults = AndroidConfig.Colors.assignColorValue(modConfig.modResults, {
        name,
        value,
      });
    }

    return modConfig;
  });
}

module.exports = function withImagePickerCropTheme(config) {
  config = withCropColours(config, withAndroidColors);
  config = withCropColours(config, withAndroidColorsNight);

  return withStringsXml(config, (modConfig) => {
    modConfig.modResults = AndroidConfig.Strings.setStringItem(
      [
        AndroidConfig.Resources.buildResourceItem({
          name: 'crop_image_menu_crop',
          value: 'Use photo',
        }),
      ],
      modConfig.modResults,
    );

    return modConfig;
  });
};
