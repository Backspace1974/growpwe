# GrowPWE

Protótipo estático em português para gestão e acompanhamento de associações autorizadas.

## Executar localmente

Na raiz do projeto, execute `python -m http.server 8080` e abra o servidor no navegador. Não há dependências de instalação.

## Hospedar no GitHub Pages

Em Settings → Pages, escolha **Deploy from a branch**, branch **main** e diretório **/ (root)**. Salve e aguarde o GitHub informar o endereço publicado.

## Estado do protótipo

- Navegação, filtros por fase e criação de registros demonstrativos.
- Registros novos armazenados somente no navegador via localStorage.
- Sem backend, autenticação, isolamento de dados entre associações ou compartilhamento real.
- Dados exibidos são fictícios. Não insira dados pessoais ou sensíveis nesta demonstração.
- Biblioteca acadêmica ainda sem estudos verificados; os repositórios são candidatos à pesquisa.

Os registros de exemplo podem ser restaurados removendo a chave `growpwe-demo` do armazenamento local do navegador.
