import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ImportRow {
  rowNumber: number;
  name: string;
  email: string;
  phone?: string;
  setor?: string;
  password?: string;
  status: 'pending' | 'success' | 'error';
  errorMessage?: string;
}

const VALID_SETORES = [
  'Expedição',
  'Comercial',
  'Jurídico',
  'Compras',
  'RH',
  'Controladoria',
  'Cirurgia Segura',
  'Administrativo',
  'TI',
  'Financeiro',
  'Presidência'
];

export default function AdminImportUsers() {
  const [importedData, setImportedData] = useState<ImportRow[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [validationComplete, setValidationComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download template Excel file
  const downloadTemplate = () => {
    const templateData = [
      {
        'Nome*': 'João da Silva',
        'Email*': 'joao.silva@empresa.com.br',
        'Telefone': '(11) 99999-9999',
        'Departamento': 'Administrativo',
        'Senha*': '123456'
      },
      {
        'Nome*': 'Maria Santos',
        'Email*': 'maria.santos@empresa.com.br',
        'Telefone': '(11) 88888-8888',
        'Departamento': 'RH',
        'Senha*': '123456'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Nome
      { wch: 30 }, // Email
      { wch: 18 }, // Telefone
      { wch: 25 }, // Departamento
      { wch: 15 }  // Senha
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuários');
    
    // Add instructions sheet
    const instructionsData = [
      { 'Instruções': 'Campos marcados com * são obrigatórios' },
      { 'Instruções': '' },
      { 'Instruções': 'Departamentos válidos:' },
      { 'Instruções': '- Expedição' },
      { 'Instruções': '- Comercial' },
      { 'Instruções': '- Jurídico' },
      { 'Instruções': '- Compras' },
      { 'Instruções': '- RH' },
      { 'Instruções': '- Controladoria' },
      { 'Instruções': '- Cirurgia Segura' },
      { 'Instruções': '- Administrativo' },
      { 'Instruções': '- TI' },
      { 'Instruções': '- Financeiro' },
      { 'Instruções': '- Presidência' },
      { 'Instruções': '' },
      { 'Instruções': 'Formato de email: nome@empresa.com.br' },
      { 'Instruções': 'Senha padrão sugerida: 123456 (usuário trocará no primeiro acesso)' },
    ];
    const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
    wsInstructions['!cols'] = [{ wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

    XLSX.writeFile(wb, 'modelo_importacao_usuarios.xlsx');
    
    toast({
      title: 'Download iniciado',
      description: 'O modelo de planilha foi baixado com sucesso.'
    });
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsValidating(true);
    setValidationComplete(false);
    setImportedData([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast({
          title: 'Planilha vazia',
          description: 'A planilha não contém dados para importar.',
          variant: 'destructive'
        });
        setIsValidating(false);
        return;
      }

      // Get existing emails from database
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('email');
      
      const existingEmails = new Set(existingProfiles?.map(p => p.email.toLowerCase()) || []);
      const emailsInFile = new Set<string>();

      // Parse and validate data
      const parsedData: ImportRow[] = jsonData.map((row: any, index: number) => {
        const name = row['Nome*']?.toString().trim() || '';
        const email = row['Email*']?.toString().trim().toLowerCase() || '';
        const phone = row['Telefone']?.toString().trim() || '';
        const setor = row['Departamento']?.toString().trim() || '';
        const password = row['Senha*']?.toString().trim() || '';

        const errors: string[] = [];

        // Required field validation
        if (!name) errors.push('Nome é obrigatório');
        if (!email) errors.push('Email é obrigatório');
        if (!password) errors.push('Senha é obrigatória');

        // Email format validation
        if (email && !isValidEmail(email)) {
          errors.push('Email inválido');
        }

        // Check for duplicate email in database
        if (email && existingEmails.has(email)) {
          errors.push('Email já cadastrado no sistema');
        }

        // Check for duplicate email in file
        if (email && emailsInFile.has(email)) {
          errors.push('Email duplicado na planilha');
        }
        emailsInFile.add(email);

        // Password validation
        if (password && password.length < 6) {
          errors.push('Senha deve ter no mínimo 6 caracteres');
        }

        // Department validation
        if (setor && !VALID_SETORES.includes(setor)) {
          errors.push(`Departamento inválido. Use: ${VALID_SETORES.join(', ')}`);
        }

        return {
          rowNumber: index + 2, // +2 because row 1 is header, and Excel is 1-indexed
          name,
          email,
          phone,
          setor,
          password,
          status: errors.length > 0 ? 'error' : 'pending',
          errorMessage: errors.length > 0 ? errors.join('; ') : undefined
        } as ImportRow;
      });

      setImportedData(parsedData);
      setValidationComplete(true);

      const errorCount = parsedData.filter(r => r.status === 'error').length;
      if (errorCount > 0) {
        toast({
          title: 'Validação concluída com erros',
          description: `${errorCount} de ${parsedData.length} registros possuem erros que precisam ser corrigidos.`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Validação concluída',
          description: `${parsedData.length} registros prontos para importação.`
        });
      }
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: 'Erro ao ler arquivo',
        description: 'Não foi possível ler a planilha. Verifique se o formato está correto.',
        variant: 'destructive'
      });
    } finally {
      setIsValidating(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Import users
  const importUsers = async () => {
    const validRows = importedData.filter(r => r.status === 'pending');
    if (validRows.length === 0) {
      toast({
        title: 'Nenhum registro válido',
        description: 'Corrija os erros na planilha e tente novamente.',
        variant: 'destructive'
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    const updatedData = [...importedData];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const dataIndex = updatedData.findIndex(r => r.rowNumber === row.rowNumber);

      try {
        // Call edge function to create user
        const { data, error } = await supabase.functions.invoke('import-user', {
          body: {
            name: row.name,
            email: row.email,
            password: row.password,
            phone: row.phone || null,
            setor: row.setor || null
          }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        updatedData[dataIndex] = { ...updatedData[dataIndex], status: 'success' };
        successCount++;
      } catch (error: any) {
        console.error('Error importing user:', error);
        updatedData[dataIndex] = { 
          ...updatedData[dataIndex], 
          status: 'error',
          errorMessage: error.message || 'Erro ao criar usuário'
        };
        errorCount++;
      }

      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
      setImportedData([...updatedData]);
    }

    setIsImporting(false);

    if (errorCount === 0) {
      toast({
        title: 'Importação concluída',
        description: `${successCount} usuários foram criados com sucesso.`
      });
    } else {
      toast({
        title: 'Importação parcial',
        description: `${successCount} usuários criados, ${errorCount} com erro.`,
        variant: 'destructive'
      });
    }
  };

  const clearData = () => {
    setImportedData([]);
    setValidationComplete(false);
    setImportProgress(0);
  };

  const hasErrors = importedData.some(r => r.status === 'error');
  const hasPending = importedData.some(r => r.status === 'pending');
  const successCount = importedData.filter(r => r.status === 'success').length;
  const errorCount = importedData.filter(r => r.status === 'error').length;
  const pendingCount = importedData.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Usuários via Planilha
          </CardTitle>
          <CardDescription>
            Cadastre múltiplos usuários de uma só vez através de uma planilha Excel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={downloadTemplate} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Baixar Modelo de Planilha
            </Button>
            
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={isValidating || isImporting}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload de Planilha
                  </>
                )}
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Instruções</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Baixe o modelo de planilha clicando no botão acima</li>
                <li>Preencha os dados dos usuários (campos com * são obrigatórios)</li>
                <li>Faça o upload da planilha preenchida</li>
                <li>Verifique os dados e corrija eventuais erros</li>
                <li>Clique em "Importar Usuários" para finalizar</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Results Card */}
      {importedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dados da Planilha</CardTitle>
                <CardDescription className="mt-1">
                  {importedData.length} registros encontrados
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {pendingCount > 0 && (
                    <Badge variant="secondary">{pendingCount} pendentes</Badge>
                  )}
                  {successCount > 0 && (
                    <Badge className="bg-green-500 hover:bg-green-600">{successCount} sucesso</Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge variant="destructive">{errorCount} erros</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Importando usuários...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Linha</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importedData.map((row) => (
                    <TableRow key={row.rowNumber} className={row.status === 'error' ? 'bg-destructive/10' : ''}>
                      <TableCell className="font-medium">{row.rowNumber}</TableCell>
                      <TableCell>{row.name || '-'}</TableCell>
                      <TableCell>{row.email || '-'}</TableCell>
                      <TableCell>{row.phone || '-'}</TableCell>
                      <TableCell>{row.setor || '-'}</TableCell>
                      <TableCell>
                        {row.status === 'pending' && (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                        {row.status === 'success' && (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        )}
                        {row.status === 'error' && (
                          <div className="space-y-1">
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Erro
                            </Badge>
                            {row.errorMessage && (
                              <p className="text-xs text-destructive max-w-xs">{row.errorMessage}</p>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={clearData} disabled={isImporting}>
                Limpar
              </Button>
              <Button 
                onClick={importUsers} 
                disabled={isImporting || !hasPending}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar {pendingCount} Usuários
                  </>
                )}
              </Button>
            </div>

            {hasErrors && hasPending && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  Existem registros com erros. Apenas os registros válidos serão importados.
                  Corrija a planilha e faça o upload novamente para importar os registros com erro.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
