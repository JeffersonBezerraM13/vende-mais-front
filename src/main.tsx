/* import de fontes de estilos são definidos nesse arquivo arquivo para ser padrão e ficar diponivel do app inteiro */

import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'

/*
 *  Camada de vigilância com StrictMode
 *  O react avisa sobre coisas que podem dar problema no futuro.
 *  Exemplo:
 *  - efeitos estranhos
 *  - codigo com comportamente não seguro
 *  - padrõs antigos ou perigosos
 *  Não é obrigatório, mas é uma boa prática.
 *  */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/App'

import '@/app/styles/index.css'


/* Define a div root do index.html como um territorio controlado pelo React */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
