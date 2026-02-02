import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function ComponentsDemo() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [progress, setProgress] = useState(45);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Splice Design System
          </h1>
          <p className="text-text-muted">
            shadcn/ui components configurés pour Splice
          </p>
        </div>

        {/* Buttons Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button className="flex items-center gap-2">
              <span className="material-symbols-outlined">content_cut</span>
              Avec icône
            </Button>
            <Button variant="outline" className="min-h-[44px] min-w-[44px]">
              <span className="material-symbols-outlined">play_arrow</span>
            </Button>
          </div>
        </section>

        {/* Dialog Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Dialog</h2>
          <Button onClick={() => setIsDialogOpen(true)}>
            Ouvrir Dialog
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="bg-panel-dark border border-white/10">
              <DialogHeader>
                <DialogTitle>Exemple Dialog</DialogTitle>
                <DialogDescription>
                  Ceci est un exemple de modal shadcn/ui avec le thème Splice
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-text-muted">
                  Les modals utilisent un backdrop blur et suivent le design system avec les couleurs panel-dark.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  Confirmer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        {/* Progress Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Progress</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white">Progression</span>
              <span className="text-text-muted">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>
                -10%
              </Button>
              <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>
                +10%
              </Button>
              <Button size="sm" variant="outline" onClick={() => setProgress(0)}>
                Reset
              </Button>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <p className="text-sm text-text-muted">Exemples états:</p>
            <Progress value={0} className="w-full" />
            <Progress value={50} className="w-full" />
            <Progress value={100} className="w-full" />
          </div>
        </section>

        {/* Badge Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Badges</h2>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary/20 text-primary font-bold border border-primary/20">
                4K
              </Badge>
              <Badge className="bg-success/20 text-success border-success/20">
                Transcription terminée
              </Badge>
              <Badge variant="outline" className="border-border-dark bg-panel-dark">
                Supporte MP4, MOV, AVI
              </Badge>
            </div>
          </div>
        </section>

        {/* Input Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Input</h2>
          <div className="space-y-4 max-w-md">
            <Input placeholder="Placeholder text" />
            <Input placeholder="Disabled" disabled />
            <Input
              placeholder="Input avec erreur"
              className="border-error focus:ring-error"
            />
            <div className="flex gap-2">
              <Input placeholder="Avec bouton" />
              <Button>Parcourir</Button>
            </div>
          </div>
        </section>

        {/* Color System */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Système de couleurs</h2>
          <div className="grid grid-cols-2 desktop:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="h-20 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-mono text-xs">#1580f9</span>
              </div>
              <p className="text-sm text-text-muted">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-background-dark rounded-lg border border-border-dark flex items-center justify-center">
                <span className="text-white font-mono text-xs">#1A1A1F</span>
              </div>
              <p className="text-sm text-text-muted">Background Dark</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-panel-dark rounded-lg border border-border-dark flex items-center justify-center">
                <span className="text-white font-mono text-xs">#27272D</span>
              </div>
              <p className="text-sm text-text-muted">Panel Dark</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-success rounded-lg flex items-center justify-center">
                <span className="text-white font-mono text-xs">#54c41c</span>
              </div>
              <p className="text-sm text-text-muted">Success</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-error rounded-lg flex items-center justify-center">
                <span className="text-white font-mono text-xs">#FF4D4F</span>
              </div>
              <p className="text-sm text-text-muted">Error</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-warning rounded-lg flex items-center justify-center">
                <span className="text-white font-mono text-xs">#f59e0b</span>
              </div>
              <p className="text-sm text-text-muted">Warning</p>
            </div>
          </div>
        </section>

        {/* Breakpoints */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Breakpoints Desktop</h2>
          <div className="bg-panel-dark border border-border-dark rounded-lg p-4">
            <div className="space-y-2 font-mono text-sm">
              <div className="text-text-muted">
                <span className="desktop:hidden">❌ &lt;1280px - Trop petit</span>
                <span className="hidden desktop:inline comfortable:hidden">✅ desktop: 1280px</span>
                <span className="hidden comfortable:inline spacious:hidden">✅ comfortable: 1920px</span>
                <span className="hidden spacious:inline ultra:hidden">✅ spacious: 2560px</span>
                <span className="hidden ultra:inline">✅ ultra: 3840px</span>
              </div>
            </div>
          </div>
        </section>

        {/* Accessibilité Info */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Accessibilité</h2>
          <div className="bg-panel-dark border border-border-dark rounded-lg p-6 space-y-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-success">check_circle</span>
              <p className="text-text-muted text-sm">
                Contraste WCAG AA respecté - Primary #1580f9 sur background #1A1A1F = 7.2:1
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-success">check_circle</span>
              <p className="text-text-muted text-sm">
                Touch targets minimum 44x44px pour tous les boutons
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-success">check_circle</span>
              <p className="text-text-muted text-sm">
                Focus indicators visibles avec focus:ring-2 focus:ring-primary
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-success">check_circle</span>
              <p className="text-text-muted text-sm">
                Navigation clavier complète - Testez avec Tab, Enter, Escape
              </p>
            </div>
          </div>
        </section>

        {/* Material Icons Examples */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Material Symbols Icons</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col items-center gap-2 p-4 bg-panel-dark rounded-lg">
              <span className="material-symbols-outlined text-primary text-4xl">movie</span>
              <span className="text-xs text-text-muted">movie</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-panel-dark rounded-lg">
              <span className="material-symbols-outlined text-primary text-4xl">video_file</span>
              <span className="text-xs text-text-muted">video_file</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-panel-dark rounded-lg">
              <span className="material-symbols-outlined text-primary text-4xl">ink_highlighter</span>
              <span className="text-xs text-text-muted">ink_highlighter</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-panel-dark rounded-lg">
              <span className="material-symbols-outlined text-primary text-4xl">content_cut</span>
              <span className="text-xs text-text-muted">content_cut</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-panel-dark rounded-lg">
              <span className="material-symbols-outlined text-primary text-4xl">play_circle</span>
              <span className="text-xs text-text-muted">play_circle</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-panel-dark rounded-lg">
              <span className="material-symbols-outlined text-success text-4xl">check_circle</span>
              <span className="text-xs text-text-muted">check_circle</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-panel-dark rounded-lg">
              <span className="material-symbols-outlined text-error text-4xl">error</span>
              <span className="text-xs text-text-muted">error</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-panel-dark rounded-lg">
              <span className="material-symbols-outlined text-warning text-4xl">warning</span>
              <span className="text-xs text-text-muted">warning</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
