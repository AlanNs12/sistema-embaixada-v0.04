# I18N Context — Sistema de Gestão da Portaria da Embaixada

> **Diagnóstico completo para implementação de internacionalização (i18n) nativa**
> Gerado em: 2026-07-15
> Versão do projeto: v0.04

---

## 1. Objetivo

Implementar suporte a múltiplos idiomas (Português como padrão, Inglês como segundo idioma) permitindo adicionar novos idiomas futuramente sem alterar componentes nem funcionalidades do sistema.

**Idiomas planejados:**
- `pt-BR` — Português brasileiro (idioma padrão)
- `en-US` — Inglês americano

---

## 2. Levantamento de Textos

### 2.1 Estrutura do Projeto para i18n

| Camada | Tecnologia | Arquivos afetados |
|--------|-----------|------------------|
| Frontend | React 18 + Vite | 21 arquivos JSX |
| Backend | Express.js | 11 arquivos JS |
| PDF | jspdf + jspdf-autotable | 1 arquivo (Reports.jsx) |
| HTML Entry | index.html | 1 arquivo |

### 2.2 Páginas — Títulos, Subtítulos e Descrições

| Página | Strings encontradas |
|--------|-------------------|
| **Login.jsx** | `"Gestão Portaria"`, `"Embassy of the Phillipines in Brazil"`, `"Email"`, `"Senha"`, `"Entrar"`, `"Entrando..."`, placeholders `"seu@email.com"`, `"••••••••"`, toast `"Erro ao fazer login"` |
| **Dashboard.jsx** | `"Dashboard"`, `"Atualizar"`, cards: `"Funcionários Presentes"`, `"Veículos na Rua"`, `"Prestadores Dentro"`, `"Encomendas Pendentes"`; collapsible: `"Funcionários Presentes"`, `"Veículos na Rua"`, `"Prestadores / Visitantes"`, `"Encomendas Pendentes"`, `"Terceirizados Presentes"`; badges: `"Presente"`, `"Fora"`, `"Prestador"`, `"Consular"`, `"Aguardando"`; empty: `"Nenhum funcionário no momento"`, `"Nenhum veículo fora"`, `"Ninguém no momento"`, `"Nenhuma encomenda pendente"`; `"Ver todos ({count})"`, `"Sem motivo informado"`, `"Sem destinatário"`, `"Erro ao carregar dados"`, `"Tentar novamente"`, `"Erro ao carregar dashboard"`; entrou/saiu: `"Entrou {time}"`, `"Saiu {time}"`, `"entrou {time}"` |
| **EmployeeAttendance.jsx** | `"Controle de Funcionários"`, `"Registro de ponto diário"`, `"Somente leitura"`, `"Visitando registros de {date}. Edições só são permitidas no dia atual."`, `"Buscar funcionário..."`, `"{n} presentes"`, `"{n} ausentes"`; tabela: `"Funcionário"`, `"Entrada"`, `"Saída Almoço"`, `"Retorno Almoço"`, `"Saída"`, `"Obs."`, `"Status"`, `"Carregando..."`; status: `"Saiu"`, `"Almoço"`, `"Presente"`, `"Ausente"`; tooltip `"Só é possível editar o ponto do dia atual"`, `"Adicionar observação"`; modal: `"Observação — {name}"`, `"Observação do dia {date}"`, `"Cancelar"`, `"Salvar"`; placeholder `"Atraso, atestado, saída antecipada..."`; bloqueio `"Edição bloqueada para datas anteriores"`; toast: `"Horário registrado!"`, `"Observação salva!"`, `"Erro ao carregar"`, `"Erro"` |
| **OutsourcedAttendance.jsx** | `"Controle de Terceirizados"`, `"Jardineiros e equipe de limpeza"`, `"Somente leitura"`, `"Visitando {date}. Edições só são permitidas no dia atual."`, `"{n} presentes"`, `"{n} ausentes"`; tabela: `"Nome"`, `"Função"`, `"Empresa"`, `"Entrada"`, `"Saída"`, `"Status"`; roles: `"Jardineiro"`, `"Limpeza"`; status: `"Saiu"`, `"Presente"`, `"Ausente"`; empty: `"Nenhum terceirizado cadastrado"`, `"Carregando..."`; tooltip `"Ver detalhes"`; toast: `"Registrado!"`, `"Erro ao registrar"`, `"Erro ao carregar"`; tooltip `"Só é possível editar o ponto do dia atual"` |
| **Vehicles.jsx** | `"Controle de Veículos"`, `"Saídas e retornos da frota"`, `"Registrar Saída"`, `"hoje às {time}"`, `"saiu {date/time}"`, `"{n} veículo(s) fora agora"`, `"Registrar retorno"`; tabela: `"Veículo"`, `"Saída"`, `"Retorno"`, `"Condutor"`, `"Motivo"`, `"Passageiros/Obs."`, `"Ações"`, `"Status"`; empty: `"Nenhum registro nesta data"`, `"Carregando..."`; modal saida: `"Registrar Saída de Veículo"`, `"Veículo *"`, `"Horário Saída *"`, `"Condutor"`, `"Motivo"`, `"Passageiros"`, `"Observações"`, `"Registrar"`, `"Cancelar"`, `"Selecione..."`; placeholders: `"Busca de documentos, manutenção..."`; option disabled: `" (fora — aguardando retorno)"`; toast: `"Preencha os campos obrigatórios"`, `"Este veículo já possui uma saída em aberto..."`, `"Saída registrada!"`, `"Erro ao carregar"`, `"Erro"`; modal retorno: `"Registrar Retorno"`, `"Data de Retorno"`, `"Horário de Retorno"`, `"Confirmar"`, `"Saiu em {date} às {time}"`; validação: `"O horário de retorno não pode ser anterior à saída."`, `"O horário de retorno não pode ser anterior à saída ({date} às {time})."`; toast: `"Retorno registrado!"`; obs modal: `"Editar Observações"`, `"Observações / Passageiros"`, `"Salvar"`, `"Observação salva!"`, `"Ver detalhes"`; placeholder: `"Passageiros, detalhes da viagem, observações..."`; vehicle label: `"Veículo: {plate} — {model}"` |
| **ServiceProviders.jsx** | `"Prestadores de Serviço"`, `"Controle de acesso e visitas"`, `"Registrar Entrada"`, `"Prestadores na embaixada agora:"`; tabela: `"Nome"`, `"Empresa"`, `"Motivo"`, `"Funcionário"`, `"Entrada"`, `"Saída"`, `"Status"`; status: `"Saiu"`, `"Reg. saída"`, `"Dentro"`; empty: `"Nenhum registro nesta data"`, `"Carregando..."`; modal: `"Registrar Entrada de Prestador"`, `"Prestador Cadastrado (opcional)"`, `"Novo / não cadastrado"`, `"Nome *"`, `"Empresa"`, `"Motivo da Visita"`, `"Funcionário Responsável"`, `"Selecione..."`, `"Foto do Documento"`, `"Tirar Foto"`, `"Buscar da Galeria"`, `"Registrar"`, `"Cancelar"`; photo msg: `"Foto selecionada"`, `"Tire uma foto ou escolha da galeria"`; tooltip `"Ver detalhes"`; toast: `"Erro ao carregar"`, `"Entrada registrada!"`, `"Erro"`, `"Saída registrada!"` |
| **Consular.jsx** | `"Atendimentos Consulares"`, `"Controle de visitantes para atendimento"`, `"Novo Atendimento"`, `"Visitantes na embaixada agora:"`, `"c/ {employee}"`; tabela: `"Visitante"`, `"Motivo"`, `"Funcionário"`, `"Agendado"`, `"Entrada"`, `"Saída"`, `"Status"`; status: `"Saiu"`, `"Reg. saída"`, `"Aguardando"`; empty: `"Nenhum atendimento nesta data"`, `"Carregando..."`; modal: `"Novo Atendimento Consular"`, `"Buscar atendimento anterior (preenche o formulário automaticamente)"`, `"Nome do visitante..."`, `"Nenhum atendimento anterior encontrado"`, `"Nome do Visitante *"`, `"Motivo"`, `"Funcionário"`, `"Horário Agendado"`, `"Foto do Documento"`, `"atend. anterior"`, `"Tirar Foto"`, `"Buscar da Galeria"`, `"Registrar"`, `"Cancelar"`, `"Observações"`; photo msg: `"Foto selecionada"`, `"Foto do atendimento anterior"`, `"Tire uma foto ou escolha da galeria"`; search: `"Último atendimento: {date}"`; toast: `"Nome obrigatório"`, `"Atendimento registrado!"`, `"Erro"`, `"Saída registrada!"` |
| **Packages.jsx** | `"Controle de Encomendas"`, `"Recebimento e entrega de pacotes"`, `"Registrar Encomenda"`; filtros: `"Pendentes"`, `"Entregues"`, `"Todas"`; tabela: `"Destinatário"`, `"Empresa"`, `"Rastreio"`, `"Recebido em"`, `"Entregue a"`, `"Status"`, `"Ações"`; status: `"Entregue"`, `"Pendente"`; empty: `"Nenhuma encomenda"`, `"Carregando..."`; modal register: `"Registrar Encomenda Recebida"`, `"Empresa Entregadora *"`, `"Código de Rastreio"`, `"Funcionário Destinatário"`, `"Nome do Destinatário"`, `"Observações"`, `"Registrar"`, `"Cancelar"`, `"Selecione..."`; placeholder: `"Correios, JadLog..."`; tooltip: `"Escanear código de barras"`; modal edit: `"Editar Encomenda"`, `"Salvar"`, mesmas labels; modal deliver: `"Registrar Entrega"`, `"Entregue para (funcionário)"`, `"Nome de quem recebeu"`, `"Confirmar"`, `"Selecione..."`; toast: `"Empresa entregadora obrigatória"`, `"Encomenda registrada!"`, `"Erro"`, `"Entrega registrada!"`, `"Encomenda atualizada!"`, `"Código lido!"` |
| **Visitors.jsx** | `"Visitantes"`, `"Controle geral de visitantes"`, `"Registrar Entrada"`, `"{n} visitante(s) na embaixada agora"`; tabela: `"Visitante"`, `"Documento"`, `"Motivo"`, `"Funcionário"`, `"Entrada"`, `"Saída"`, `"Status"`; status: `"Saiu"`, `"Reg. saída"`, `"Dentro"`; empty: `"Nenhum visitante nesta data"`, `"Carregando..."`; modal: `"Registrar Entrada de Visitante"`, `"Buscar visita anterior (preenche o formulário automaticamente)"`, `"Nome ou número do documento..."`, `"Nenhuma visita anterior encontrada"`, `"Nome Completo *"`, `"Nº Documento"`, `"Motivo da Visita"`, `"Funcionário a Visitar"`, `"Foto do Documento"`, `"visita anterior"`, `"Tirar Foto"`, `"Buscar da Galeria"`, `"Registrar"`, `"Cancelar"`, `"Observações"`; placeholder: `"RG, CPF, Passaporte..."`; photo msg: `"Foto selecionada"`, `"Foto da visita anterior"`, `"Tire uma foto ou escolha da galeria"`; search: `"Última visita: {date}"`; toast: `"Nome do visitante obrigatório"`, `"Entrada registrada!"`, `"Erro ao carregar"`, `"Saída registrada!"` |
| **Reports.jsx** | `"Relatórios"`, `"Exportação por período — CSV e PDF"`; campos: `"Tipo"`, `"Data Inicial"`, `"Data Final"`; botões: `"Gerar"`, `"Gerando..."`, tooltips `"Exportar CSV"`, `"Exportar PDF"`; filtro: `"Filtrar por funcionário"`, `"Todos os funcionários"`; botões extra: `"PDF por funcionário"`, `"PDF individual"`; dica: `"O PDF vai gerar uma página separada para cada funcionário"`; empty: `"Nenhum registro no período"`; contador: `"{n} registros"`, `"de {name}"`; relatório types: `"Ponto de Funcionários"`, `"Ponto de Terceirizados"`, `"Controle de Veículos"`, `"Prestadores de Serviço"`, `"Atendimentos Consulares"`, `"Encomendas"`, `"Visitantes"`; toast: `"Erro ao gerar relatório"`, `"Nenhum dado para exportar"`, `"PDF gerado!"` |
| **EmbassyInfo.jsx** | `"Informações da Embaixada"`, `"Contatos e telefones úteis"`, `"Adicionar"`; empty: `"Carregando..."`, `"Nenhuma informação cadastrada."`, `"Adicionar primeiro item"`; categorias: `"telefone"`, `"email"`, `"site"`, `"outro"`; modal: `"Editar Informação"`, `"Nova Informação"`, `"Categoria"`, `"Rótulo *"`, `"Valor *"`, `"Descrição"`, `"Salvar"`, `"Cancelar"`; options: `"Telefone"`, `"Email"`, `"Site"`, `"Outro"`; placeholders: `"Ex: Secretaria, Emergências..."`, `"Número, email ou URL"`; toast: `"Rótulo e valor são obrigatórios"`, `"Atualizado!"`, `"Criado!"`, `"Erro"`, `"Remover este item?"`, `"Removido"` |

### 2.3 Admin Pages — Títulos, Subtítulos e Descrições

| Página | Strings encontradas |
|--------|-------------------|
| **AdminEmployees.jsx** | `"Funcionários da Embaixada"`, `"Cadastro e gestão dos funcionários"`, `"Novo Funcionário"`; search: `"Buscar por nome ou setor..."`; drag hint: `"Arraste as linhas para reordenar"`; tabela: `"Nome"`, `"Cargo"`, `"Setor"`, `"Email"`, `"Telefone"`, `"Status"`, `"Ações"`; status: `"Ativo"`, `"Inativo"`; empty: `"Carregando..."`, `"Nenhum funcionário encontrado"`; modal: `"Editar Funcionário"`, `"Novo Funcionário"`, `"Nome Completo *"`, `"Cargo"`, `"Setor / Departamento"`, `"Email"`, `"Telefone"`, `"Status"`, `"Salvar"`, `"Cancelar"`; toast: `"Nome é obrigatório"`, `"Funcionário atualizado!"`, `"Funcionário cadastrado!"`, `"Erro"`, `"Ordem salva!"`, `"Erro ao salvar ordem"` |
| **AdminUsers.jsx** | `"Usuários do Sistema"`, `"Gerenciamento de acessos"`, `"Novo Usuário"`; tabela: `"Nome"`, `"Email"`, `"Perfil"`, `"Status"`, `"Criado em"`; status: `"Ativo"`, `"Inativo"`; badge `"você"`; roles: `"Super Admin"`, `"Admin"`, `"Porteiro"`, `"Visualizador (só leitura)"`; modal: `"Editar Usuário"`, `"Novo Usuário"`, `"Nome *"`, `"Email *"`, `"Nova senha (deixe em branco para não alterar)"`, `"Senha *"`, `"Perfil"`; perm descs: `"Permissões por perfil:"`, `"Apenas leitura — sem criar ou editar"`, `"Registra todos os controles diários"`, `"Porteiro + cadastros e relatórios"`, `"Acesso total"`; toast: `"Nome e email obrigatórios"`, `"Senha obrigatória para novo usuário"`, `"Usuário atualizado!"`, `"Usuário criado!"`, `"Erro"` |
| **AdminVehicles.jsx** | `"Frota de Veículos"`, `"Cadastro e gestão dos veículos"`, `"Novo Veículo"`; vehicle card: status `"Ativo"`, `"Inativo"`; empty: `"Carregando..."`, `"Nenhum veículo cadastrado."`, `"Cadastrar veículo"`; modal: `"Editar Veículo"`, `"Novo Veículo"`, `"Placa *"`, `"Modelo"`, `"Descrição"`, `"Status"`, `"Salvar"`, `"Cancelar"`; placeholders: `"ABC-1234"`, `"Ex: Toyota Corolla, Volkswagen Tiguan..."`, `"Cor, ano, detalhes..."`; toast: `"Placa é obrigatória"`, `"Veículo atualizado!"`, `"Veículo cadastrado!"`, `"Erro"` |
| **AdminOutsourced.jsx** | Titulo geral: `"Cadastros"`, `"Terceirizados e prestadores recorrentes"`; tabs: `"Terceirizados"`, `"Prestadores Recorrentes"`; OutsourcedTab: contador `"{n} terceirizado(s) cadastrado(s)"`, tabela `"Nome"`, `"Função"`, `"Empresa"`, `"Status"`; roles: `"Jardineiro"`, `"Limpeza"`; status: `"Ativo"`, `"Inativo"`; empty: `"Carregando..."`; modal: `"Editar Terceirizado"`, `"Novo Terceirizado"`, `"Nome *"`, `"Função"`, `"Empresa"`, `"Status"`, `"Salvar"`, `"Cancelar"`; ProvidersTab: contador `"{n} prestador(es) cadastrado(s)"`, tabela `"Nome"`, `"Empresa"`, `"Notas"`, `"Documento"`; doc status: `"Cadastrado"`; modal: `"Editar Prestador"`, `"Novo Prestador"`, `"Nome *"`, `"Empresa"`, `"Foto do Documento"`, `"Notas"`, `"Salvar"`, `"Cancelar"`; doc exists: `"✓ Documento já cadastrado"`; toast: `"Nome obrigatório"`, `"Salvo!"`, `"Erro"` |
| **AuditLogs.jsx** | `"Log de Ações"`, `"Histórico de todas as ações realizadas"`, `"Atualizar"`; filtro: `"Filtrar por usuário"`, `"Todos os usuários"`; tabela: `"Data/Hora"`, `"Usuário"`, `"O que foi feito"`, `"Tipo"`; empty: `"Carregando..."`, `"Nenhum registro"`; footer: `"Últimos 100 registros"`; modal: `"Detalhes da Ação"`, `"Fechar"`; metadados: `"Tipo de registro"`, `"Ação realizada"`, `"ID do registro"`, `"IP de acesso"`; section: `"Dados registrados"`; contexto: `"Por {user} em {date}"`; descriptions dinâmicas extensas — ver seção 2.8 |

### 2.4 Componentes — Strings

| Componente | Strings encontradas |
|-----------|-------------------|
| **Layout.jsx** | Sidebar: `"Gestão Portaria"`, `"Embassy of the Phillipines"`; navegação: `"Dashboard"`, `"Funcionários"`, `"Terceirizados"`, `"Veículos"`, `"Prestadores"`, `"Visitantes"`, `"Atend. Consular"`, `"Encomendas"`, `"Relatórios"`, `"Informações"`, `"Administração"`; admin sub: `"Funcionários"`, `"Usuários"`, `"Veículos"`, `"Terceirizados"`, `"Auditoria"`; footer: roles `"Super Admin"`, `"Admin"`, `"Porteiro"`, `"Visualizador"`; `"Sair"`; tooltip `"Alterar senha"` |
| **ChangePasswordModal.jsx** | `"Alterar senha"`, `"Senha atual"`, `"Nova senha"`, `"Confirmar nova senha"`, `"Cancelar"`, `"Alterar senha"`, `"Salvando…"`; validation: `"Informe a senha atual"`, `"A nova senha deve ter entre 8 e 128 caracteres"`, `"As senhas não coincidem"`; toast: `"Senha alterada com sucesso!"`, `"Senha atual incorreta"`, `"Erro ao alterar senha"` |
| **DetailModal.jsx** | 6 tipos de modais com labels completos — ver seção 2.8 |
| **Modal.jsx** | Componente genérico — só renderiza `title` passado |
| **BarcodeScanner.jsx** | `"Escanear Código de Barras"`, `"Aponte a câmera para o código de barras da encomenda"`, `"Cancelar"`; errors: `"O acesso à câmera requer HTTPS..."`, `"Permissão de câmera negada..."`, `"Nenhuma câmera encontrada..."`, `"Não foi possível acessar a câmera..."`, `"Erro ao ler código. Reposicione a câmera."`; camera label: `"Câmera {id}"` |
| **CameraCapture.jsx** | `"Tirar Foto"`, `"Capturar Foto"`, `"Cancelar"`; errors: `"O acesso à câmera requer HTTPS..."`, `"Permissão de câmera negada. Permita o acesso e tente novamente."`, `"Nenhuma câmera encontrada neste dispositivo."`, `"Não foi possível acessar a câmera. Verifique as permissões."` |
| **DocImage.jsx** | `"Ver doc."`, `"Documento"` (alt text) |

### 2.5 DetailModal — Labels e Status (6 tipos)

| Tipo | Título | Labels de informação | Status possíveis | Timeline |
|------|--------|---------------------|------------------|----------|
| `consular` | `"Atendimento Consular"` | `"Visitante"`, `"Motivo da Visita"`, `"Funcionário"`, `"Data"`, `"Horário Agendado"`, `"Observações"` | `"Encerrado"`, `"Em atendimento"`, `"Aguardando"` | `"Horários"`, `"Entrada"`, `"Saída"` |
| `provider_visit` | `"Visita de Prestador"` | `"Nome"`, `"Empresa"`, `"Motivo"`, `"Funcionário"`, `"Data"`, `"Observações"` | `"Saiu"`, `"Na embaixada"` | `"Horários"`, `"Entrada"`, `"Saída"` |
| `visitor` | `"Visitante"` | `"Nome"`, `"Nº Documento"`, `"Motivo"`, `"Funcionário"`, `"Data"`, `"Observações"` | `"Saiu"`, `"Na embaixada"` | `"Horários"`, `"Entrada"`, `"Saída"` |
| `vehicle_log` | `"Saída de Veículo"` | `"Condutor"`, `"Passageiros"`, `"Motivo"`, `"Data"`, `"Observações"` | `"Retornou"`, `"Fora"` | `"Horários"`, `"Saída"`, `"Retorno"` |
| `employee_attendance` | `"Ponto do Funcionário"` | `"Data"`, `"Observações"` | `"Saiu"`, `"Almoço"`, `"Presente"`, `"Ausente"` | `"Linha do tempo"`, `"Entrada"`, `"Saída p/ Almoço"`, `"Retorno do Almoço"`, `"Saída"` |
| `outsourced_attendance` | `"Ponto Terceirizado"` | `"Data"`, `"Observações"` | `"Saiu"`, `"Presente"`, `"Ausente"` | `"Horários"`, `"Entrada"`, `"Saída"` |
| `package` | `"Encomenda"` | `"Destinatário"`, `"Empresa Entregadora"`, `"Código de Rastreio"`, `"Recebido em"`, `"Observações"`, delivery: `"✓ Entrega confirmada"`, `"Entregue para"`, `"Entregue em"` | `"Entregue"`, `"Pendente"` | n/a |
| **Common** | — | `"Foto do documento não registrada"`, `"Ampliar"`; footer: `"Fechar"` | — | — |

### 2.6 Backend — Mensagens da API (error/validation)

#### Auth (`auth.js`)
- `"Email inválido"` (validation)
- `"Senha inválida"` (validation)
- `"Credenciais inválidas"` (401 login)
- `"Token não fornecido"` (401 middleware)
- `"Token inválido ou expirado"` (401 middleware)
- `"Acesso negado para este perfil"` (403 middleware)
- `"Perfil de visualização não pode realizar alterações"` (403 middleware)
- `"Senha atual incorreta"` (401 change pw)
- `"Senha alterada com sucesso"` (success)
- `"Mínimo 8 caracteres"` (validation)
- `"As senhas não coincidem"` (validation)

#### Users (`users.js`)
- `"Nome deve ter entre 2 e 100 caracteres"` (validation)
- `"Email inválido"` (validation)
- `"Senha deve ter entre 8 e 128 caracteres"` (validation)
- `"Perfil inválido"` (validation)
- `"Email já cadastrado"` (409)
- `"Usuário atualizado com sucesso"` (success)

#### Employees (`employees.js`)
- `"Nome deve ter entre 2 e 150 caracteres"` (validation)
- `"Cargo muito longo"` (validation)
- `"Setor muito longo"` (validation)
- `"Email inválido"` (validation)
- `"Telefone muito longo"` (validation)
- `"order deve ser um array"` (400)
- `"Ordem atualizada"` (success)
- `"Funcionário atualizado"` (success)
- `"Funcionário obrigatório"` (400 attendance)

#### Outsourced (`outsourced.js`)
- `"Nome deve ter entre 2 e 150 caracteres"` (validation)
- `"Função é obrigatória e deve ter no máximo 100 caracteres"` (validation)
- `"Função inválida"` (validation)
- `"Empresa muito longa"` (validation)
- `"Terceirizado atualizado"` (success)
- `"Terceirizado obrigatório"` (400 attendance)
- `"Registro não encontrado"` (404)

#### Vehicles (`vehicles.js`)
- `"Placa inválida"` (validation)
- `"Modelo muito longo"` (validation)
- `"Descrição muito longa"` (validation)
- `"Placa já cadastrada"` (409)
- `"Veículo atualizado"` (success)
- `"Nome do motorista muito longo"` (validation)
- `"Passageiros muito longo"` (validation)
- `"Motivo muito longo"` (validation)
- `"Observações muito longas"` (validation)
- `"Veículo e horário de saída são obrigatórios"` (400)
- `"Este veículo já possui uma saída em aberto..."` (409)
- `"O horário de retorno não pode ser anterior à saída."` (409)
- `"Registro não encontrado"` (404)

#### Service Providers (`serviceProviders.js`)
- `"Nome deve ter entre 2 e 150 caracteres"` (validation)
- `"Empresa muito longa"` (validation)
- `"Notas muito longas"` (validation)
- `"Prestador atualizado"` (success)
- `"Nome do visitante muito longo"` (validation)
- `"Motivo muito longo"` (validation)

#### Consular (`consular.js`)
- `"Nome do visitante inválido"` (validation)
- `"Motivo muito longo"` (validation)
- `"Notas muito longas"` (validation)

#### Packages (`packages.js`)
- `"Empresa entregadora inválida"` (validation)
- `"Código de rastreio muito longo"` (validation)
- `"Nome do destinatário muito longo"` (validation)
- `"Observações muito longas"` (validation)
- `"Nome de entrega muito longo"` (validation)

#### Visitors (`visitors.js`)
- `"Nome do visitante inválido"` (validation)
- `"Número de documento muito longo"` (validation)
- `"Motivo muito longo"` (validation)
- `"Observações muito longas"` (validation)

#### Dashboard & Reports (`dashboard.js`)
- `"Categoria, rótulo e valor são obrigatórios"` (400)
- `"Atualizado"` (success)
- `"Removido"` (success)
- `"Tipo de relatório inválido"` (400)

#### Global
- `"Muitas tentativas de login. Tente novamente em 15 minutos."` (429 rate limiter)
- `"Rota não encontrada"` (404)
- `"Erro interno"` (500)

#### Upload config (`upload.js`)
- `"Formato não permitido. Use JPG, PNG ou WEBP."`

#### Images (`images.js`)
- `"Imagem não encontrada"` (404)

### 2.7 AuditLogs — Constantes de Tradução (já são chaves de i18n informal)

**`ENTITY_PT`** (entity -> display name):
```
auth, user, employee, employee_attendance, outsourced_worker, 
outsourced_attendance, vehicle, vehicle_log, service_provider,
provider_visit, consular_appointment, package, embassy_info, visitor
```

**`ACTION_PT`** (action -> display text):
```
LOGIN, CREATE, UPDATE, UPSERT, DELETE
```

**`FIELD_PT`** (column name -> display label):
69 campos mapeados — de `vehicle_id` até `status`

**`ROLE_PT`** e **`BOOL_PT`**: roles e booleanos

**`humanDescription`**: ~15 funções de descrição dinâmica com concatenação de strings em português

### 2.8 AuditLogs — Descrições Humanas (complexas, com concatenação)

Estas strings são geradas dinamicamente em `humanDescription()`:

- `"Entrou no sistema"` (auth login)
- `"Registrou ponto: {parts}"` e `"Registrou ponto de funcionário"`
- `"entrada às {time}"`, `"saída almoço às {time}"`, `"retorno almoço às {time}"`, `"saída às {time}"`, `"observação: {text}"`
- `"Registrou ponto de terceirizado: {parts}"`
- `"Registrou retorno do veículo às {time}"`
- `"Registrou saída de veículo às {time} — motivo: {reason}"`
- `"Editou observações da saída de veículo"`
- `"{action} veículo {plate} ({model})"`, `"{action} veículo"`
- `"{action} funcionário: {name}"`, `"{action} funcionário"`
- `"{action} usuário: {name} ({role})"`, `"{action} usuário"`
- `"{action} prestador: {name}"`, `"{action} prestador"`
- `"Registrou saída de prestador"`
- `"Registrou entrada de prestador: {name} ({company})"`, `"Registrou entrada de prestador"`
- `"Registrou saída de atendimento consular"`
- `"Registrou atendimento consular de: {name}"`, `"Registrou atendimento consular"`
- `"Registrou saída de visitante"`
- `"Registrou entrada de visitante: {name}"`, `"Registrou entrada de visitante"`
- `"Registrou entrega de encomenda para: {name}"`
- `"Registrou encomenda de: {company} para {name}"`
- `"Editou encomenda"`
- `"{action} informação: {label}"`, `"{action} informação da embaixada"`

---

## 3. PDFs

### 3.1 Geração de PDF

**Localização:** `frontend\src\pages\Reports.jsx`
**Biblioteca:** `jspdf` (v4.2.1) + `jspdf-autotable` (v5.0.7)
**Geração:** 100% client-side (navegador do usuário)
**Formatos:** A4, landscape (horizontal) por padrão

### 3.2 Strings fixas do cabeçalho PDF (`PDF_CONFIG`)

| Propriedade | Valor atual | Tipo |
|------------|------------|------|
| `titulo` | `"Gestão Portaria"` | título principal |
| `subtitulo` | `"Embassy of the Philippines in Brazil"` | subtítulo/instituição |
| `rodape` | `"Documento gerado automaticamente pelo Sistema de Gestão da Portaria"` | rodapé |

### 3.3 Strings no método `drawHeader()`

- `"Gerado em: {dd/MM/yyyy às HH:mm}"` — data de geração (canto superior direito)
- `"Relatório: "` — prefixo do tipo de relatório
- `"Funcionário: "` — prefixo para nome do funcionário (modo por funcionário)
- `"Período: {start} a {end}"` — período do relatório
- `"Total: {n} registros"` — contagem de registros

### 3.4 Strings no método `drawFooters()`

- `"Página {n} de {total}"` — numeração de páginas

### 3.5 Nomes de colunas nas tabelas PDF (`COLUMNS`)

| Tipo de relatório | Colunas |
|------------------|---------|
| `employee_attendance` | `"Data"`, `"Funcionário"`, `"Setor"`, `"Entrada"`, `"Saída Almoço"`, `"Retorno"`, `"Saída"`, `"Observação"` |
| `outsourced_attendance` | `"Data"`, `"Nome"`, `"Função"`, `"Empresa"`, `"Entrada"`, `"Saída"` |
| `vehicles` | `"Data"`, `"Placa"`, `"Modelo"`, `"Saída"`, `"Retorno"`, `"Condutor"`, `"Passageiros"`, `"Observações"` |
| `providers` | `"Data/Hora"`, `"Nome"`, `"Empresa"`, `"Motivo"`, `"Funcionário"`, `"Entrada"`, `"Saída"` |
| `consular` | `"Data"`, `"Visitante"`, `"Motivo"`, `"Funcionário"`, `"Agendado"`, `"Entrada"`, `"Saída"` |
| `packages` | `"Data"`, `"Destinatário"`, `"Empresa"`, `"Rastreio"`, `"Entregue a"`, `"Status"` |
| `visitors` | `"Data"`, `"Visitante"`, `"Documento"`, `"Motivo"`, `"Funcionário"`, `"Entrada"`, `"Saída"` |

### 3.6 Strings nos dados das linhas PDF (`getRow()`)

- Status de packages: `"Entregue"`, `"Pendente"`
- Valores vazios representados como `"—"`
- `"Sem nome"` (fallback para funcionário sem nome)

---

## 4. Formatação de Dados

### 4.1 Datas

| Uso | Função | Arquivo | Precisa de i18n API |
|----|--------|---------|-------------------|
| Data no Dashboard | `format(new Date(), "EEEE, dd 'De' MMMM 'De' yyyy")` com locale `ptBR` | Dashboard.jsx:97 | ✅ Sim (nome do dia e mês) |
| Data em DetailModal | `format(new Date(v), 'HH:mm')` | DetailModal.jsx | Não (formato numérico) |
| Data+hora em DetailModal | `format(new Date(v), "dd/MM/yyyy 'às' HH:mm")` | DetailModal.jsx:14 | ✅ Sim ("às") |
| Data formatada | `"dd/MM/yyyy"` (manual split) | DetailModal.jsx:22 | ✅ Sim (formato muda por locale) |
| Data na tabela de encomendas | `format(new Date(p.received_at), 'dd/MM/yyyy HH:mm')` | Packages.jsx:124 | ✅ Sim |
| Data em Consular | `fmtDate()` manual split `dd/MM/yyyy` | Consular.jsx:22 | ✅ Sim |
| Data em Visitors | `fmtDate()` manual split `dd/MM/yyyy` | Visitors.jsx:21 | ✅ Sim |
| Data no AuditLog | `format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')` com `ptBR` | AuditLogs.jsx:195 | ✅ Sim |
| Data no AdminUsers | `new Date(u.created_at).toLocaleDateString('pt-BR')` | AdminUsers.jsx:71 | ✅ Sim |
| Data nos PDFs | `fmtDate()` via split `dd/MM/yyyy` | Reports.jsx:96-105 | ✅ Sim |

**Biblioteca atual:** `date-fns` (v3.6.0) com locale `ptBR`

### 4.2 Moeda

⚠️ **Não há formatação de moeda no projeto atualmente.** O sistema não lida com valores monetários.

### 4.3 Números

Números aparecem apenas como contadores (quantidade de registros, pessoas). Não há formatação especial de milhares ou decimais.

### 4.4 Horários

Todos os horários são formatados como `HH:mm` (24h). A preposição "às" é usada em português e precisaria ser adaptada:
- `"Entrou {time}"` → em inglês seria `"Entered at {time}"`
- `"Saiu {time}"` → `"Left at {time}"`
- `"hoje às {time}"` → `"today at {time}"`

### 4.5 Timezone

- Backend usa `America/Sao_Paulo` explicitamente em:
  - `visitors.js:60-62` — `(NOW() AT TIME ZONE 'America/Sao_Paulo')::date`
  - `consular.js:58-59` — mesma construção
  - `dashboard.js:143,155` — queries de relatórios
- Frontend usa `new Date()` localmente (timezone do navegador)

---

## 5. Código — Arquivos com Strings Hardcoded

### 5.1 Arquivos com strings em JSX (componentes React)

| Arquivo | Linhas | Estimativa de strings |
|---------|--------|---------------------|
| `frontend\src\pages\Dashboard.jsx` | 231 | ~40 strings |
| `frontend\src\pages\EmployeeAttendance.jsx` | 203 | ~35 strings |
| `frontend\src\pages\OutsourcedAttendance.jsx` | 152 | ~25 strings |
| `frontend\src\pages\Vehicles.jsx` | 291 | ~55 strings |
| `frontend\src\pages\ServiceProviders.jsx` | 217 | ~40 strings |
| `frontend\src\pages\Consular.jsx` | 305 | ~50 strings |
| `frontend\src\pages\Packages.jsx` | 248 | ~50 strings |
| `frontend\src\pages\Visitors.jsx` | 310 | ~55 strings |
| `frontend\src\pages\Reports.jsx` | 449 | ~50 strings + PDF |
| `frontend\src\pages\EmbassyInfo.jsx` | 124 | ~25 strings |
| `frontend\src\pages\Login.jsx` | 78 | ~12 strings |
| `frontend\src\pages\admin\AdminEmployees.jsx` | 195 | ~30 strings |
| `frontend\src\pages\admin\AdminUsers.jsx` | 121 | ~30 strings |
| `frontend\src\pages\admin\AdminVehicles.jsx` | 107 | ~22 strings |
| `frontend\src\pages\admin\AdminOutsourced.jsx` | 188 | ~35 strings |
| `frontend\src\pages\admin\AuditLogs.jsx` | 278 | ~80 strings |
| `frontend\src\components\Layout.jsx` | 148 | ~22 strings |
| `frontend\src\components\DetailModal.jsx` | 372 | ~70 strings |
| `frontend\src\components\ChangePasswordModal.jsx` | 86 | ~15 strings |
| `frontend\src\components\BarcodeScanner.jsx` | 163 | ~12 strings |
| `frontend\src\components\CameraCapture.jsx` | 102 | ~10 strings |
| `frontend\src\components\DocImage.jsx` | 66 | ~3 strings |
| `frontend\src\components\Modal.jsx` | 19 | 0 (genérico) |

### 5.2 Arquivos com strings no backend

| Arquivo | Strings de API |
|---------|---------------|
| `backend\src\index.js` | error 404, 500, rate limit message, CORS error |
| `backend\src\middleware\auth.js` | "Token não fornecido", "Token inválido ou expirado", "Acesso negado", "Perfil de visualização..." |
| `backend\src\routes\auth.js` | 6 validações, 4 erros, 1 sucesso |
| `backend\src\routes\users.js` | 8 validações, 3 erros, 1 sucesso |
| `backend\src\routes\employees.js` | 8 validações, 3 erros, 2 sucessos |
| `backend\src\routes\outsourced.js` | 6 validações, 3 erros, 2 sucessos |
| `backend\src\routes\vehicles.js` | 12 validações, 7 erros, 1 sucesso |
| `backend\src\routes\serviceProviders.js` | 7 validações, 1 sucesso |
| `backend\src\routes\consular.js` | 3 validações |
| `backend\src\routes\packages.js` | 5 validações |
| `backend\src\routes\visitors.js` | 4 validações |
| `backend\src\routes\dashboard.js` | 2 erros, 2 sucessos |
| `backend\src\routes\images.js` | "Imagem não encontrada" |
| `backend\src\config\upload.js` | "Formato não permitido..." |

### 5.3 Padrões de concatenação

O projeto usa extensivamente concatenação de strings com interpolação, especialmente em:
- `DetailModal.jsx` — concatenação de dados em labels de info
- `AuditLogs.jsx` — `humanDescription()` complexa
- `Dashboard.jsx` — badges e labels com hora (`"Entrou {time}"`, `"Saiu {time}"`)
- `Vehicles.jsx` — formatação de data/hora (`"hoje às {time}"`, `"Saiu em {date} às {time}"`)
- `Consular.jsx` e `Visitors.jsx` — search result display (`"Último atendimento: {date}"`)

### 5.4 Textos dentro de atributos JSX

- `title` (tooltips): `"Só é possível editar o ponto do dia atual"`, `"Adicionar observação"`, `"Ver detalhes"`, `"Escanear código de barras"`, `"Exportar CSV"`, `"Exportar PDF"`, `"Alterar senha"`
- `placeholder`: `"seu@email.com"`, `"••••••••"`, `"Buscar funcionário..."`, `"Buscar por nome ou setor..."`, `"Nome do visitante..."`, `"Nome ou número do documento..."`, `"Correios, JadLog..."`, `"RG, CPF, Passaporte..."`, `"Busca de documentos, manutenção..."`, `"Atraso, atestado, saída antecipada..."`, `"Passageiros, detalhes da viagem, observações..."`, `"ABC-1234"`, `"Ex: Toyota Corolla, Volkswagen Tiguan..."`, `"Cor, ano, detalhes..."`, `"Ex: Secretaria, Emergências..."`, `"Número, email ou URL"`
- `alt`: `"Logo"`, `"Documento"`, `"doc"`

### 5.5 Mensagens toast (react-hot-toast)

Arquivos que usam toast com strings hardcoded (não são chaves):

- `Login.jsx`: `"Erro ao fazer login"`
- `Dashboard.jsx`: `"Erro ao carregar dashboard"`
- `EmployeeAttendance.jsx`: `"Horário registrado!"`, `"Observação salva!"`, `"Erro ao carregar"`, `"Erro"`
- `OutsourcedAttendance.jsx`: `"Registrado!"`, `"Erro ao registrar"`, `"Erro ao carregar"`
- `Vehicles.jsx`: `"Preencha os campos obrigatórios"`, `"Este veículo já possui uma saída em aberto..."` etc.
- `ServiceProviders.jsx`: `"Erro ao carregar"`, `"Entrada registrada!"`, `"Saída registrada!"`
- `Consular.jsx`: `"Erro"`, `"Nome obrigatório"`, `"Atendimento registrado!"`, `"Saída registrada!"`
- `Packages.jsx`: `"Empresa entregadora obrigatória"`, `"Erro"`, `"Encomenda registrada!"` etc.
- `Visitors.jsx`: `"Erro ao carregar"`, `"Nome do visitante obrigatório"`, `"Entrada registrada!"` etc.
- `Reports.jsx`: `"Erro ao gerar relatório"`, `"Nenhum dado para exportar"`, `"PDF gerado!"`
- `EmbassyInfo.jsx`: `"Erro"`, `"Rótulo e valor são obrigatórios"`, `"Atualizado!"`, `"Criado!"`, `"Removido"`
- `ChangePasswordModal.jsx`: `"Senha alterada com sucesso!"`, `"Erro ao alterar senha"`
- Admin pages: múltiplas mensagens de sucesso e erro

### 5.6 Strings no `index.html`

```html
<html lang="pt-BR">
<title>Gestão Portaria</title>
```

---

## 6. Estratégia de Arquitetura i18n

### 6.1 Biblioteca Recomendada

**`react-i18next`** (react-i18next + i18next)

Razões:
- Ecossistema maduro e mais utilizado no React
- Suporte a lazy loading de namespaces
- Detecção automática de idioma do navegador (`i18next-browser-languagedetector`)
- Interpolação de variáveis (`{{name}}`)
- Pluralização (`_zero`, `_one`, `_other`)
- Formatação de data via `date-fns` (já usado no projeto) + `dayjs` ou `Intl`
- Persistência em localStorage integrada
- Suporte a backend HTTP para carregamento assíncrono

### 6.2 Estrutura de Pastas

```
frontend/src/
├── i18n/
│   ├── index.js              # Configuração principal do i18next
│   ├── detector.js            # Configuração de detecção de idioma
│   ├── locales/
│   │   ├── pt-BR/
│   │   │   ├── common.json    # Botões, labels, ações genéricas
│   │   │   ├── auth.json      # Login, senha, autenticação
│   │   │   ├── dashboard.json # Dashboard
│   │   │   ├── employees.json # Funcionários + ponto
│   │   │   ├── outsourced.json# Terceirizados + ponto
│   │   │   ├── vehicles.json  # Veículos
│   │   │   ├── providers.json # Prestadores
│   │   │   ├── consular.json  # Atendimentos consulares
│   │   │   ├── packages.json  # Encomendas
│   │   │   ├── visitors.json  # Visitantes
│   │   │   ├── reports.json   # Relatórios + PDF
│   │   │   ├── embassyInfo.json # Informações da embaixada
│   │   │   ├── admin.json     # Admin: usuários, funcionários, veículos
│   │   │   ├── audit.json     # Auditoria
│   │   │   ├── detailModal.json # Modal de detalhes
│   │   │   ├── layout.json    # Sidebar, navbar, footer
│   │   │   ├── validation.json# Mensagens de validação (front+back)
│   │   │   └── api.json       # Mensagens de erro/sucesso da API
│   │   └── en-US/
│   │       ├── common.json
│   │       ├── auth.json
│   │       ├── ... (mesmos namespaces)
│   │       └── api.json
│   └── scripts/
│       └── extractKeys.js     # Script auxiliar para extrair chaves não traduzidas
```

### 6.3 Convenção de Chaves

Usar **snake_case** com namespace como contexto implícito:

```json
// common.json
{
  "save": "Salvar",
  "cancel": "Cancelar",
  "close": "Fechar",
  "confirm": "Confirmar",
  "search": "Buscar",
  "loading": "Carregando...",
  "no_results": "Nenhum registro encontrado",
  "required_field": "Campo obrigatório",
  "select_option": "Selecione...",
  "status_active": "Ativo",
  "status_inactive": "Inativo",
  "actions": "Ações",
  "edit": "Editar",
  "delete": "Remover",
  "yes": "Sim",
  "no": "Não",
  "all": "Todos",
  "not_informed": "Não informado",
  "read_only": "Somente leitura",
  "update": "Atualizar",
  "view_details": "Ver detalhes",
  "add_observation": "Adicionar observação"
}
```

Para textos com variáveis, usar interpolação:
```json
{
  "records_count": "{{count}} registros",
  "record_count_one": "{{count}} registro",
  "record_count_other": "{{count}} registros",
  "entered_at": "Entrou {{time}}",
  "left_at": "Saiu {{time}}",
  "visit_date": "Última visita: {{date}}"
}
```

### 6.4 Namespaces e Suas Responsabilidades

| Namespace | Responsabilidades |
|-----------|------------------|
| `common` | Botões genéricos, status (Ativo/Inativo), ações CRUD, placeholders padrão |
| `auth` | Tela de login, alteração de senha, mensagens de autenticação |
| `dashboard` | Cards do dashboard, estados vazios, badges |
| `employees` | Tabela de ponto, colunas, status (Presente/Ausente/Almoço/Saiu) |
| `outsourced` | Ponto de terceirizados, roles (Jardineiro/Limpeza), colunas |
| `vehicles` | Controle de veículos, modais de saída/retorno, observações |
| `providers` | Prestadores de serviço, modais de entrada, foto de documento |
| `consular` | Atendimentos consulares, busca de anteriores, foto |
| `packages` | Encomendas, status (Pendente/Entregue), scanner, entrega |
| `visitors` | Visitantes, busca de anteriores, status |
| `reports` | Relatórios, tipos, PDF (cabeçalhos, colunas, rodapés) |
| `embassyInfo` | Informações da embaixada, categorias, formulários |
| `admin` | CRUD de funcionários, usuários, veículos, terceirizados, prestadores |
| `audit` | Logs de auditoria, descrições humanas, FIELD_PT, ENTITY_PT |
| `detailModal` | Modal de detalhes (todos os 6 tipos + comum) |
| `layout` | Sidebar, navbar, breadcrumbs, footer do usuário |
| `validation` | Mensagens de validação de formulários |
| `api` | Mensagens de erro/sucesso da API (usadas em toasts) |

### 6.5 Lazy Loading dos Idiomas

```javascript
// i18n/index.js
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

i18n
  .use(Backend)           // Carrega JSONs sob demanda
  .use(LanguageDetector)  // Detecta idioma do navegador
  .use(initReactI18next)
  .init({
    fallbackLng: 'pt-BR',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'employees', 'outsourced', 'vehicles',
         'providers', 'consular', 'packages', 'visitors', 'reports',
         'embassyInfo', 'admin', 'audit', 'detailModal', 'layout',
         'validation', 'api'],
    interpolation: { escapeValue: false },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
```

**Observação:** Como o projeto usa Vite, os JSONs podem ser importados estaticamente via `import` para evitar HTTP requests (preferível para performance):

```javascript
// Alternativa sem HTTP Backend (usando import dinâmico)
const loadLocale = async (lng, ns) => {
  const module = await import(`./locales/${lng}/${ns}.json`)
  return module.default
}
```

### 6.6 Persistência do Idioma

- localStorage com chave `i18nextLng`
- Valor persistido entre sessões
- Fallback: idioma do navegador (`navigator.language`)
- Último fallback: `pt-BR`

### 6.7 Idioma Padrão e Fallback

| Configuração | Valor |
|-------------|-------|
| Idioma padrão | `pt-BR` |
| Fallback | `pt-BR` (se a chave não existir no idioma selecionado) |
| Detecção automática | Sim, via `navigator.language` |
| Idiomas suportados | `['pt-BR', 'en-US']` |

### 6.8 Adicionar Novos Idiomas

Para adicionar um novo idioma (ex: `es-ES`):
1. Criar pasta `frontend/src/i18n/locales/es-ES/`
2. Copiar os JSONs de `pt-BR/` como template
3. Traduzir os valores
4. Adicionar `'es-ES'` ao array de idiomas suportados
5. Nenhuma alteração necessária nos componentes

### 6.9 Seletor de Idioma na UI

Adicionar um dropdown/toggle na sidebar (`Layout.jsx`), próximo ao toggle de tema, com bandeiras ou siglas:
- `PT` → pt-BR
- `EN` → en-US

---

## 7. Migração — Plano por Etapas

### Etapa 1 — Inventário dos Textos (1 dia)
**Responsável:** Desenvolvedor
- [x] Concluído com este documento

### Etapa 2 — Extração das Strings (2-3 dias)
**Responsável:** Desenvolvedor
1. Instalar `react-i18next` e `i18next`
2. Criar estrutura de pastas `src/i18n/locales/{pt-BR,en-US}/`
3. Criar arquivo de configuração `src/i18n/index.js`
4. Criar todos os 19 namespaces JSON com chaves vazias
5. Preencher `pt-BR/` com todas as strings extraídas do código
6. Traduzir `pt-BR/` → `en-US/`
7. Configurar `LanguageDetector` e persistência

### Etapa 3 — Criação das Chaves (1 dia)
**Responsável:** Desenvolvedor
1. Definir convenção de nomes para todas as chaves
2. Garantir que chaves sejam descritivas e agrupadas logicamente
3. Mapear todas as strings para chaves

### Etapa 4 — Substituição Gradual (4-5 dias)
**Responsável:** Desenvolvedor

Substituir strings hardcoded por chamadas `t()` nos componentes, na seguinte ordem:

| Fase | Componentes/Páginas | Complexidade |
|------|-------------------|-------------|
| 4.1 | `common.json` + `Modal.jsx` + `Layout.jsx` + `Login.jsx` | Baixa — base para o resto |
| 4.2 | `Dashboard.jsx` | Média — muitas strings com interpolação |
| 4.3 | Admin pages (`AdminEmployees`, `AdminUsers`, `AdminVehicles`, `AdminOutsourced`) | Média — forms e tabelas |
| 4.4 | `EmployeeAttendance.jsx` + `OutsourcedAttendance.jsx` | Média — time buttons, status |
| 4.5 | `Vehicles.jsx` + `ServiceProviders.jsx` | Alta — modais com validações |
| 4.6 | `Consular.jsx` + `Visitors.jsx` + `Packages.jsx` | Alta — busca, foto, múltiplos modais |
| 4.7 | `DetailModal.jsx` + `ChangePasswordModal.jsx` | Alta — 6 tipos de modal |
| 4.8 | `EmbassyInfo.jsx` + `Reports.jsx` | Alta — PDF com strings fixas |
| 4.9 | `AuditLogs.jsx` | Muito Alta — descrições dinâmicas complexas |
| 4.10 | `BarcodeScanner.jsx` + `CameraCapture.jsx` + `DocImage.jsx` | Baixa — componentes isolados |

### Etapa 5 — Validação (2 dias)
**Responsável:** Desenvolvedor + QA
1. Revisar cada página nos dois idiomas
2. Verificar que nenhum texto hardcoded escapou (usar grep para texto em pt)
3. Verificar formatação de datas em ambos os idiomas
4. Testar toasts de erro/sucesso
5. Testar modo escuro + i18n combinados
6. Testar PDFs em inglês (títulos, colunas, rodapés)
7. Verificar placeholders, tooltips, alt texts
8. Testar validações de formulário (frontend + backend)

### Etapa 6 — Testes (1 dia)
**Responsável:** Desenvolvedor
1. Teste de troca de idioma sem reload
2. Teste de persistência (fechar e reabrir)
3. Teste de fallback para chaves inexistentes
4. Teste de detecção automática (limpar localStorage, testar com navegador em inglês)
5. Teste em mobile (Android + iOS)
6. Teste de todos os fluxos: login → dashboard → cada módulo → admin → relatórios

---

## 8. Resultado Esperado — Checklist

### 8.1 Quantidade Aproximada de Textos

| Categoria | Quantidade estimada |
|-----------|-------------------|
| Botões e ações | ~60 |
| Labels de formulário | ~120 |
| Títulos de página | ~25 |
| Subtítulos/descrições | ~18 |
| Cabeçalhos de tabela | ~80 |
| Status e badges | ~35 |
| Placeholders | ~18 |
| Tooltips | ~12 |
| Mensagens toast (sucesso) | ~25 |
| Mensagens toast (erro) | ~30 |
| Estados vazios | ~10 |
| Mensagens de validação (frontend) | ~15 |
| Mensagens de validação (backend/API) | ~50 |
| Navegação (sidebar) | ~22 |
| DetailModal (labels + status + timeline) | ~70 |
| PDF (cabeçalhos + colunas + rodapés) | ~40 |
| AuditLogs (descrições + traduções de campos) | ~100 |
| Erros de câmera/scanner | ~12 |
| **Total estimado** | **~750 strings únicas** |

### 8.2 Componentes Afetados (7)
1. `Layout.jsx` — sidebar, logo, user footer
2. `Modal.jsx` — (genérico, não requer alterações internas)
3. `DetailModal.jsx` — 6 tipos de detalhes com labels
4. `ChangePasswordModal.jsx` — formulário de senha
5. `BarcodeScanner.jsx` — mensagens de câmera
6. `CameraCapture.jsx` — mensagens de câmera
7. `DocImage.jsx` — botão "Ver doc."

### 8.3 Páginas Afetadas (15)
1. `Login.jsx`
2. `Dashboard.jsx`
3. `EmployeeAttendance.jsx`
4. `OutsourcedAttendance.jsx`
5. `Vehicles.jsx`
6. `ServiceProviders.jsx`
7. `Consular.jsx`
8. `Packages.jsx`
9. `Visitors.jsx`
10. `Reports.jsx`
11. `EmbassyInfo.jsx`
12. `admin/AdminEmployees.jsx`
13. `admin/AdminUsers.jsx`
14. `admin/AdminVehicles.jsx`
15. `admin/AdminOutsourced.jsx`
16. `admin/AuditLogs.jsx`

### 8.4 PDFs Afetados
- `Reports.jsx` — único gerador de PDF (7 tipos de relatórios)
- Todas as strings de cabeçalho, rodapé, colunas e dados

### 8.5 APIs Afetadas (Backend)
- Todos os 11 arquivos de rota (`auth`, `users`, `employees`, `outsourced`, `vehicles`, `serviceProviders`, `consular`, `packages`, `visitors`, `dashboard`, `images`)
- 3 middlewares (`auth`, `validate`, `upload`)
- `index.js` (rate limit message, 404, 500)
- **Estratégia para API:** Enviar mensagens traduzidas do backend ou usar chaves de tradução no frontend para mapear códigos de erro? Recomendação: usar chaves de tradução no frontend (ex: `api:errors.invalid_credentials`) e mapear mensagens de erro da API para essas chaves.

### 8.6 Arquivos que Precisam Ser Alterados

**Frontend (23 arquivos):**
- Todos os 21 arquivos JSX listados acima
- `index.html` (atualizar `lang` dinamicamente)
- `main.jsx` (adicionar provider i18n)

**Backend (14 arquivos):**
- 11 rotas + 3 middlewares + `index.js`
- Opção A: Refatorar para retornar códigos de erro + mensagens em inglês como fallback
- Opção B: Retornar chave de tradução no response e frontend resolve

**Config (novos arquivos):**
- `src/i18n/index.js`
- 38 arquivos JSON de tradução (19 namespaces × 2 idiomas)
- Atualização do `vite.config.js` (se necessário para import dinâmico)

### 8.7 Prioridades

| Prioridade | Item | Justificativa |
|-----------|------|-------------|
| 🔴 P0 | Strings comuns (`common.json`) | Base para todos os outros namespaces |
| 🔴 P0 | Layout + Sidebar | Visível em todas as páginas |
| 🔴 P0 | Login | Primeiro ponto de contato do usuário |
| 🟠 P1 | Dashboard + Attendance (funcionários + terceirizados) | Telas mais usadas diariamente |
| 🟠 P1 | Vehicles + Packages + Visitors | Telas de uso frequente |
| 🟠 P1 | DetailModal | Usado em todas as telas |
| 🟡 P2 | Consular + ServiceProviders | Uso frequente |
| 🟡 P2 | Admin pages | Uso por admins apenas |
| 🟡 P2 | Reports + PDF | Uso ocasional |
| 🟢 P3 | EmbassyInfo | Uso baixo |
| 🟢 P3 | AuditLogs | Somente admins, tela de auditoria |
| 🟢 P3 | API error messages | Backend — refatoração mais profunda |

---

## 9. Observações Importantes

### 9.1 Textos Que São Nomes Próprios (NÃO traduzir)
- `"Embassy of the Phillipines in Brazil"` — nome oficial da instituição
- `"Embassy of the Philippines in Brazil"` — alternativamente usado (consistência!)
- `"Gestão Portaria"` — nome do sistema (pode ser mantido em pt ou receber tradução "Gate Management")
- Nomes de pessoas, empresas, placas de veículos — dados do banco, nunca traduzir

### 9.2 Inconsistência Ortográfica
- `"Embassy of the Phillipines"` (com "llip") vs `"Embassy of the Philippines"` (com "ilipp")
  - Login.jsx:35: `"Embassy of the Phillipines"` (1 L, 1 P)
  - Layout.jsx:53: `"Embassy of the Phillipines"`
  - Reports.jsx:21 (PDF): `"Embassy of the Philippines"` (1 L, 1 P? verificar)

### 9.3 Desafios Específicos

**AuditLogs.jsx — `humanDescription()`:**
Função complexa com switch case que gera frases em português. Requer refatoração para usar chaves i18n com interpolação. Abordagem recomendada: criar uma função `getAuditDescription(locale, log)` que retorna a chave i18n + parâmetros.

**DetailModal.jsx — Configs inline:**
As configurações dos 6 tipos de modal estão como objetos inline com labels hardcoded. Recomendação: refatorar para usar chaves i18n via hook `useTranslation()`.

**PDF Reports.jsx:**
As strings do PDF precisam ser passadas como parâmetros (não podem usar hooks React diretamente no `drawHeader`/`getRow` pois são funções puras). Solução: receber as traduções como argumento do componente.

**Datas formatadas manualmente:**
Os métodos `fmtDate()` com split `split('-').reverse().join('/')` produzem formato `dd/MM/yyyy` que é específico do Brasil. Para inglês, deve ser `MM/dd/yyyy` ou `yyyy-MM-dd`. Usar `Intl.DateTimeFormat` ou `date-fns` com locale dinâmico.

---

## 10. Estimativa de Esforço Total

| Fase | Dias |
|------|------|
| Configuração inicial (instalação + estrutura) | 1 |
| Extração e tradução de strings | 3 |
| Substituição nos componentes | 5 |
| Backend — mapeamento de mensagens | 2 |
| PDFs — adaptação | 1 |
| Validação e correções | 2 |
| Testes | 1 |
| **Total** | **15 dias úteis** |

---

> **Nota:** Este documento é um diagnóstico completo. Nenhuma alteração foi feita no código do projeto. Todas as strings foram mapeadas a partir da leitura integral dos 44 arquivos fonte do projeto.
