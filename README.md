# GrowPWE

Protótipo estático em português para gestão e acompanhamento de associações autorizadas.

## Executar localmente

Na raiz do projeto, execute `python -m http.server 8080` e abra o servidor no navegador. Não há dependências de instalação.

## Hospedar no GitHub Pages

Em Settings → Pages, escolha **Deploy from a branch**, branch **main** e diretório **/ (root)**. Salve e aguarde o GitHub informar o endereço publicado.

## Cadastro por lote e identificação individual

O cadastro tem três etapas: lote e material biológico; local, recipientes e equipamentos; revisão e confirmação. Quantidades planejadas e iniciadas são distintas. Cada unidade iniciada recebe um UUID permanente, um código legível com prefixo, identificador de lote e sequência, e um evento de criação com data/hora. Lotes apenas planejados, com zero unidades iniciadas, não geram espécimes.

Os campos opcionais registram informações declaradas, não recomendações. Informações ausentes permanecem nulas, separadas do valor zero. A organização dos metadados é inspirada no padrão [MIAPPE](https://github.com/MIAPPE/MIAPPE); não há declaração de conformidade completa nem validação científica dos registros.

## Catálogo de cepas e cadastro simplificado

O catálogo `data/cultivars.json` contém os 100 registros enviados pelo usuário em `Texto colado.txt`. A origem, o hash SHA-256 do arquivo e o estado **não verificado** acompanham os dados. Não foram fornecidas fontes bibliográficas; esse catálogo não integra a biblioteca acadêmica verificada.

- Busque por nome no campo de cultivar; a busca ignora diferenças de caixa, acentos e pontuação.
- Selecione uma sugestão com clique ou teclado (setas e Enter); cepas próprias continuam aceitas por cadastro manual.
- A seleção sugere um nome para o lote quando o campo está vazio ou ainda tem a sugestão anterior; nomes escolhidos pelo usuário são preservados.
- O campo de quantidade define as unidades iniciadas e acompanha a quantidade planejada até que o usuário altere explicitamente o planejamento nos campos adicionais.
- Campos essenciais ficam visíveis; rastreabilidade e configurações detalhadas podem ser expandidas. Nenhum campo antigo foi eliminado.
- Faixas de THC/CBD, rendimento, floração e descrição são referências do arquivo original, acessíveis em um painel opcional. Não são resultados medidos, previsões nem afirmações médicas verificadas.
- A base não informa espécie, fotoperíodo/autoflorescência, origem, sexo observado ou fornecedor; esses campos não são inferidos.
- O lote guarda uma cópia da referência selecionada e sua origem, disponível na revisão, nos detalhes e na exportação. Editar o nome da cultivar desvincula a referência anterior.
- Se o catálogo não carregar, o cadastro manual permanece disponível.

## Etiquetas

Em **Espécimes**, selecione os registros e clique em **Preparar etiquetas**. Também é possível reimprimir uma única etiqueta nos detalhes do espécime. A reimpressão preserva o identificador.

- Dimensões configuráveis: largura de 40 a 120 mm e altura de 30 a 100 mm.
- Rolo: uma etiqueta por página, com o tamanho informado.
- A4: grade com margens de 10 mm e espaçamento de 2 mm.
- A prévia abre em uma nova aba; permita pop-ups para o site.
- Imprima em escala 100%, sem cabeçalhos/rodapés, usando o tamanho de papel correto no navegador e no driver da impressora.
- A etiqueta contém código legível, UUID completo, lote, cultivar declarada e data de início quando disponível. Nomes longos podem ser abreviados; o UUID permanece completo.
- Não há QR, código de barras ou comunicação direta com impressoras. A impressão depende do navegador e do driver; valide alinhamento, tamanho e legibilidade em uma etiqueta de teste.

## Armazenamento e limitações

- Dados armazenados somente neste navegador, na chave `growpwe-v1`; a versão anterior `growpwe-demo` é migrada sem apagar o original.
- Use **Exportar registros** para baixar uma cópia JSON com lotes, espécimes e identificadores. A interface de reimportação ainda não foi implementada.
- Limpar os dados do site pode remover os registros. Não há sincronização entre computadores nem backup em servidor.
- Sem backend, autenticação, isolamento entre associações ou compartilhamento real.
- Exemplos iniciais são fictícios. Não insira dados pessoais ou sensíveis nesta demonstração.
- A biblioteca acadêmica ainda não contém estudos verificados.
- Este cadastro não implementa ainda um diário de medições, alteração de fases ou atualização das configurações após a criação.

## Validação de desenvolvimento

Com o servidor em execução, rode `node tests/smoke.cjs` e `node tests/catalog.cjs` em um ambiente com Playwright e Chromium instalados. O script usa contextos isolados, verifica criação e revisão, migração, persistência, preservação de dados inválidos, exportação e geração de etiquetas/PDF em rolo e A4. Usa `GROWPWE_TEST_URL` e `GROWPWE_CHROMIUM` como substituições opcionais. A validação não envia impressão a dispositivos físicos.
