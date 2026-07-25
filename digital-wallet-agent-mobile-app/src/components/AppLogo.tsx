import { View, Image } from 'react-native';

export default function AppLogo() {

  return (
    <View className="items-center">
      <Image
        source={require('../../assets/images/logo.png')}
        style={{
          width:150,
          height:150
        }}
        resizeMode="contain"
      />
    </View>
  );
}