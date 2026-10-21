<?php

namespace App\Filament\Pages;

use App\Services\MediaService;
use App\Services\SiteService;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\MarkdownEditor;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Actions;
use Filament\Schemas\Components\EmbeddedSchema;
use Filament\Schemas\Components\Form;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;

class Settings extends Page
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCog6Tooth;

    protected static ?string $navigationLabel = 'Pengaturan';

    protected static ?string $title = 'Pengaturan';

    protected static ?string $slug = 'pengaturan';

    protected static ?int $navigationSort = 3;

    /** @var array<string, mixed>|null */
    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill(app(SiteService::class)->settings());
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->columns(1)
            ->components([
                Section::make('Situs')
                    ->columns(2)
                    ->schema([
                        TextInput::make('site_name')
                            ->label('Nama situs')
                            ->maxLength(80),
                        TextInput::make('bike_name')
                            ->label('Nama motor')
                            ->maxLength(120),
                        MarkdownEditor::make('about_markdown')
                            ->label('Tentang (Markdown)')
                            ->columnSpanFull(),
                    ]),
                Section::make('Foto')
                    ->description('Versi publik dibuat ulang tanpa data lokasi (EXIF/GPS). Butuh queue worker yang berjalan.')
                    ->columns(2)
                    ->schema([
                        self::photoUpload('bike_photo')->label('Foto motor (untuk halaman Garage)'),
                        self::photoUpload('portrait_photo')->label('Foto diri (untuk halaman Tentang)'),
                    ]),
                Section::make('Tautan')
                    ->columns(2)
                    ->schema([
                        TextInput::make('youtube_url')
                            ->label('Kanal YouTube')
                            ->url()
                            ->maxLength(255),
                        TextInput::make('instagram_url')
                            ->label('Instagram')
                            ->url()
                            ->maxLength(255),
                    ]),
            ]);
    }

    public function content(Schema $schema): Schema
    {
        return $schema->components([
            Form::make([EmbeddedSchema::make('form')])
                ->id('form')
                ->livewireSubmitHandler('save')
                ->footer([
                    Actions::make([
                        Action::make('save')
                            ->label('Simpan')
                            ->submit('save')
                            ->keyBindings(['mod+s']),
                    ]),
                ]),
        ]);
    }

    public function save(): void
    {
        app(SiteService::class)->saveSettings($this->form->getState());

        Notification::make()->title('Tersimpan')->success()->send();
    }

    private static function photoUpload(string $key): FileUpload
    {
        return FileUpload::make($key)
            ->disk('originals')
            ->directory('settings')
            ->visibility('private')
            ->getUploadedFileUsing(fn (string $file): ?array => app(MediaService::class)->storedPreview($file))
            ->image()
            ->acceptedFileTypes(MediaService::MIME_TYPES)
            ->maxSize(MediaService::MAX_UPLOAD_KB);
    }
}
