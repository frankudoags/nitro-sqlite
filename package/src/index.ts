import { NitroModules } from 'react-native-nitro-modules'
import { type Sqlite } from './specs/Sqlite.nitro'

const sqlite = NitroModules.createHybridObject<Sqlite>('Sqlite')

export default sqlite as Sqlite
