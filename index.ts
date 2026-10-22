import { registerRootComponent } from 'expo';
import React from 'react';
import { View, Text } from 'react-native';

function MinimalApp() {
  return React.createElement(
    View,
    { style: { flex: 1, backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center' } },
    React.createElement(
      Text,
      { style: { fontSize: 28, fontWeight: 'bold', color: '#fff' } },
      'FarmerLedger Works!'
    ),
    React.createElement(
      Text,
      { style: { fontSize: 16, color: '#fff', marginTop: 12 } },
      'If you see this, the native build is OK.'
    )
  );
}

registerRootComponent(MinimalApp);
