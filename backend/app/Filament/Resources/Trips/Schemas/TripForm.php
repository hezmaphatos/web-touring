<?php

namespace App\Filament\Resources\Trips\Schemas;

use App\Rules\Coordinates;
use App\Rules\YoutubeUrl;
use App\Services\MediaService;
use App\Services\TripService;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\MarkdownEditor;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class TripForm
{
    public const TYPES = [
        'coast' => 'Pantai',
        'highland' => 'Pegunungan',
        'forest' => 'Hutan',
        'city' => 'Kota',
    ];

    public const STATUSES = [
        'draft' => 'Draf',
        'published' => 'Dipublikasikan',
        'planned' => 'Rencana',
    ];

    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(1)
            ->components([
                Section::make('Dasar')
                    ->columns(2)
                    ->schema([
                        TextInput::make('title')
                            ->label('Judul')
                            ->required()
                            ->maxLength(255)
                            ->live(onBlur: true)
                            ->afterStateUpdated(function (Get $get, Set $set, ?string $state, string $operation): void {
                                if ($operation === 'create' || blank($get('slug'))) {
                                    $set('slug', Str::slug((string) $state));
                                }
                            }),
                        TextInput::make('slug')
                            ->label('Slug')
                            ->helperText('Bagian akhir alamat halaman, misalnya /trip/dieng. Terisi otomatis dari judul.')
                            ->required()
                            ->maxLength(255)
                            ->regex('/^[a-z0-9]+(?:-[a-z0-9]+)*$/')
                            ->unique(ignoreRecord: true),
                        Select::make('type')
                            ->label('Jenis medan')
                            ->options(self::TYPES)
                            ->required()
                            ->native(false),
                        Select::make('status')
                            ->label('Status')
                            ->options(self::STATUSES)
                            ->default('draft')
                            ->required()
                            ->native(false)
                            ->live(),
                        DatePicker::make('started_at')
                            ->label('Tanggal mulai')
                            ->native(false)
                            ->displayFormat('j M Y')
                            ->closeOnDateSelection(),
                        DatePicker::make('ended_at')
                            ->label('Tanggal selesai')
                            ->native(false)
                            ->displayFormat('j M Y')
                            ->closeOnDateSelection()
                            ->afterOrEqual('started_at'),
                        TextInput::make('summary')
                            ->label('Ringkasan satu baris')
                            ->maxLength(180)
                            ->columnSpanFull(),
                    ]),

                Section::make('Angka')
                    ->columns(2)
                    ->schema([
                        TextInput::make('distance_km')
                            ->label('Jarak')
                            ->numeric()
                            ->minValue(0)
                            ->maxValue(9999999)
                            ->step(0.1)
                            ->suffix('km'),
                        TextInput::make('max_elevation_m')
                            ->label('Titik tertinggi')
                            ->integer()
                            ->minValue(-500)
                            ->maxValue(9000)
                            ->suffix('m'),
                    ]),

                Section::make('Cerita')
                    ->schema([
                        MarkdownEditor::make('description')
                            ->label('Cerita')
                            ->helperText('Ditulis dengan Markdown. Cerita per titik singgah diisi di bagian Titik singgah.'),
                        TextInput::make('pull_quote')
                            ->label('Kutipan besar')
                            ->maxLength(255),
                        TextInput::make('planned_for')
                            ->label('Rencana waktu')
                            ->placeholder('musim kemarau 2027')
                            ->maxLength(255)
                            ->visible(fn (Get $get): bool => $get('status') === 'planned'),
                    ]),

                Section::make('Cover')
                    ->schema([
                        self::imageUpload('cover')->label('Foto cover'),
                    ]),

                Section::make('Titik singgah')
                    ->description('Urutkan sesuai rute. Koordinat bisa ditempel langsung dari Google Maps (klik kanan pada peta, lalu klik angkanya).')
                    ->schema([
                        Repeater::make('stops')
                            ->hiddenLabel()
                            ->relationship()
                            ->orderColumn('position')
                            ->reorderable()
                            ->collapsible()
                            ->defaultItems(0)
                            ->addActionLabel('Tambah titik singgah')
                            ->itemLabel(fn (array $state): ?string => $state['name'] ?? null)
                            ->columns(2)
                            ->mutateRelationshipDataBeforeFillUsing(fn (array $data): array => app(TripService::class)->stopFormData($data))
                            ->mutateRelationshipDataBeforeCreateUsing(fn (array $data): array => app(TripService::class)->stopSaveData($data))
                            ->mutateRelationshipDataBeforeSaveUsing(fn (array $data): array => app(TripService::class)->stopSaveData($data))
                            ->schema([
                                TextInput::make('name')
                                    ->label('Nama')
                                    ->required()
                                    ->maxLength(255),
                                TextInput::make('province')
                                    ->label('Provinsi')
                                    ->maxLength(255),
                                TextInput::make('coordinates')
                                    ->label('Koordinat')
                                    ->placeholder('-7.2, 109.91')
                                    ->required()
                                    ->rule(new Coordinates),
                                TextInput::make('km_marker')
                                    ->label('Kilometer ke-')
                                    ->helperText('Jarak kumulatif dari awal trip.')
                                    ->numeric()
                                    ->minValue(0)
                                    ->step(0.1)
                                    ->suffix('km'),
                                Textarea::make('note')
                                    ->label('Catatan singkat (Markdown)')
                                    ->rows(3)
                                    ->columnSpanFull(),
                            ]),
                    ]),

                Section::make('Foto')
                    ->schema([
                        Repeater::make('photos')
                            ->hiddenLabel()
                            ->relationship()
                            ->orderColumn('position')
                            ->reorderable()
                            ->collapsible()
                            ->defaultItems(0)
                            ->addActionLabel('Tambah foto')
                            ->itemLabel(fn (array $state): ?string => $state['caption'] ?? null)
                            ->columns(2)
                            ->schema([
                                self::imageUpload('image')
                                    ->label('Foto')
                                    ->required()
                                    ->columnSpanFull(),
                                TextInput::make('caption')
                                    ->label('Keterangan')
                                    ->helperText('Kalimat biasa. Juga dipakai sebagai teks alternatif.')
                                    ->maxLength(255),
                                self::stopSelect(),
                            ]),
                    ]),

                Section::make('Video')
                    ->schema([
                        Repeater::make('videos')
                            ->hiddenLabel()
                            ->relationship()
                            ->orderColumn('position')
                            ->reorderable()
                            ->collapsible()
                            ->defaultItems(0)
                            ->addActionLabel('Tambah video')
                            ->itemLabel(fn (array $state): ?string => $state['title'] ?? null)
                            ->columns(2)
                            ->mutateRelationshipDataBeforeCreateUsing(fn (array $data): array => app(TripService::class)->videoSaveData($data))
                            ->mutateRelationshipDataBeforeSaveUsing(fn (array $data): array => app(TripService::class)->videoSaveData($data))
                            ->schema([
                                TextInput::make('youtube_url')
                                    ->label('Link YouTube')
                                    ->placeholder('https://youtu.be/...')
                                    ->required()
                                    ->maxLength(255)
                                    ->rule(new YoutubeUrl)
                                    ->columnSpanFull(),
                                TextInput::make('title')
                                    ->label('Judul video')
                                    ->maxLength(255),
                                self::stopSelect(),
                            ]),
                    ]),
            ]);
    }

    private static function imageUpload(string $collection): SpatieMediaLibraryFileUpload
    {
        return SpatieMediaLibraryFileUpload::make($collection)
            ->collection($collection)
            ->conversion('webp-480')
            ->image()
            ->acceptedFileTypes(MediaService::MIME_TYPES)
            ->maxSize(MediaService::MAX_UPLOAD_KB)
            ->helperText('JPG, PNG, WebP atau AVIF, maksimal 25 MB. Data lokasi (EXIF/GPS) dibuang dari versi publik.');
    }

    private static function stopSelect(): Select
    {
        return Select::make('stop_id')
            ->label('Titik singgah')
            ->placeholder('Setelah cerita')
            ->helperText('Simpan trip dulu supaya titik singgah baru muncul di sini.')
            // Inside a repeater item $record is the photo/video, so read the trip from the page.
            ->options(fn ($livewire): array => app(TripService::class)->stopOptions(
                method_exists($livewire, 'getRecord') ? $livewire->getRecord()?->getKey() : null,
            ))
            ->native(false);
    }
}
