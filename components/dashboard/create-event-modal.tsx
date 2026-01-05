"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarCheck, Upload, Camera, Link, X } from "lucide-react"
import { type CalendarEvent } from "@/lib/mock-data"

interface CreateEventModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreateEvent: (event: Omit<CalendarEvent, "id">) => void
}

export function CreateEventModal({ open, onOpenChange, onCreateEvent }: CreateEventModalProps) {
    const [title, setTitle] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [date, setDate] = React.useState("")
    const [time, setTime] = React.useState("")
    const [location, setLocation] = React.useState("")
    const [organizer, setOrganizer] = React.useState("")

    // Image state
    const [imageSource, setImageSource] = React.useState<'upload' | 'camera' | 'url'>('upload')
    const [imageFile, setImageFile] = React.useState<File | null>(null)
    const [imagePreview, setImagePreview] = React.useState("")
    const [imageUrl, setImageUrl] = React.useState("")
    const [imageError, setImageError] = React.useState(false)
    const [errorMessage, setErrorMessage] = React.useState("")
    const [isProcessing, setIsProcessing] = React.useState(false)

    // Refs for file inputs
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const cameraInputRef = React.useRef<HTMLInputElement>(null)

    const resetForm = () => {
        setTitle("")
        setDescription("")
        setDate("")
        setTime("")
        setLocation("")
        setOrganizer("")
        setImageSource('upload')
        setImageFile(null)
        setImagePreview("")
        setImageUrl("")
        setImageError(false)
        setErrorMessage("")
        setIsProcessing(false)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!title || !description || !date || !time || !organizer) {
            return
        }

        // Combine date and time
        const eventDateTime = new Date(`${date}T${time}`)

        // Use preview (from file) if available, otherwise use URL
        const finalImageUrl = imagePreview || imageUrl || undefined

        const newEvent: Omit<CalendarEvent, "id"> = {
            title,
            description,
            date: eventDateTime,
            organizer,
            location: location || undefined,
            imageUrl: finalImageUrl,
        }

        onCreateEvent(newEvent)
        resetForm()
        onOpenChange(false)
    }

    // Validate image URL
    const isValidImageUrl = (url: string) => {
        if (!url) return true // Empty is valid (optional field)
        try {
            const urlObj = new URL(url)
            return urlObj.protocol === "http:" || urlObj.protocol === "https:"
        } catch {
            return false
        }
    }

    const handleImageUrlChange = (url: string) => {
        setImageUrl(url)
        const isValid = isValidImageUrl(url)
        setImageError(!isValid)
        if (!isValid && url) {
            setErrorMessage("Please enter a valid URL starting with http:// or https://")
        } else {
            setErrorMessage("")
        }
        // Clear file-based preview when URL is entered
        if (url) {
            setImagePreview("")
            setImageFile(null)
        }
    }

    // Handle file upload (from device gallery)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsProcessing(true)

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setImageError(true)
            setErrorMessage("Image size must be less than 5MB")
            setIsProcessing(false)
            return
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setImageError(true)
            setErrorMessage("Please select a valid image file (JPG, PNG, or WEBP)")
            setIsProcessing(false)
            return
        }

        // Generate preview
        const reader = new FileReader()
        reader.onload = () => {
            setImagePreview(reader.result as string)
            setImageFile(file)
            setImageUrl("") // Clear URL when file is selected
            setImageError(false)
            setErrorMessage("")
            setIsProcessing(false)
        }
        reader.onerror = () => {
            setImageError(true)
            setErrorMessage("Failed to read image file")
            setIsProcessing(false)
        }
        reader.readAsDataURL(file)
    }

    // Handle camera capture
    const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Same logic as file upload
        handleFileUpload(e)
    }

    // Clear selected image
    const clearImage = () => {
        setImageFile(null)
        setImagePreview("")
        setImageUrl("")
        setImageError(false)
        setErrorMessage("")
        if (fileInputRef.current) fileInputRef.current.value = ""
        if (cameraInputRef.current) cameraInputRef.current.value = ""
    }

    // Switch between tabs - clear previous selection
    const handleTabChange = (value: string) => {
        setImageSource(value as 'upload' | 'camera' | 'url')
        clearImage()
    }

    const isFormValid = title && description && date && time && organizer && !imageError && !isProcessing

    // Get display image (preview from file or URL)
    const displayImage = imagePreview || imageUrl
    const hasImage = !!displayImage && !imageError

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                        Add a new event to the campus calendar. All fields marked with * are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Event Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            placeholder="e.g., Tech Symposium 2025"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the event..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            required
                        />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">
                                Date <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">
                                Time <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="time"
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            placeholder="e.g., Main Auditorium"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    {/* Organizer */}
                    <div className="space-y-2">
                        <Label htmlFor="organizer">
                            Organizer <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="organizer"
                            placeholder="e.g., Computer Science Department"
                            value={organizer}
                            onChange={(e) => setOrganizer(e.target.value)}
                            required
                        />
                    </div>

                    {/* Event Image - Tabbed Interface */}
                    <div className="space-y-2">
                        <Label>Event Image (optional)</Label>

                        <Tabs value={imageSource} onValueChange={handleTabChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="upload" className="gap-1.5">
                                    <Upload className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Upload</span>
                                </TabsTrigger>
                                <TabsTrigger value="camera" className="gap-1.5">
                                    <Camera className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Camera</span>
                                </TabsTrigger>
                                <TabsTrigger value="url" className="gap-1.5">
                                    <Link className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">URL</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Upload Tab */}
                            <TabsContent value="upload" className="space-y-3 mt-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    aria-label="Upload image from device"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isProcessing}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {isProcessing ? "Processing..." : "Select from Device"}
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    Choose an image from your device gallery (JPG, PNG, or WEBP, max 5MB)
                                </p>
                            </TabsContent>

                            {/* Camera Tab */}
                            <TabsContent value="camera" className="space-y-3 mt-3">
                                <input
                                    ref={cameraInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleCameraCapture}
                                    className="hidden"
                                    aria-label="Capture image using camera"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => cameraInputRef.current?.click()}
                                    disabled={isProcessing}
                                >
                                    <Camera className="h-4 w-4 mr-2" />
                                    {isProcessing ? "Processing..." : "Capture Photo"}
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    Take a photo using your device camera (if supported by your browser)
                                </p>
                            </TabsContent>

                            {/* URL Tab */}
                            <TabsContent value="url" className="space-y-3 mt-3">
                                <Input
                                    id="imageUrl"
                                    type="url"
                                    placeholder="https://example.com/event-image.jpg"
                                    value={imageUrl}
                                    onChange={(e) => handleImageUrlChange(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Enter a direct link to an event image (e.g., from Unsplash, Imgur, or your server)
                                </p>
                            </TabsContent>
                        </Tabs>

                        {/* Error Message */}
                        {imageError && errorMessage && (
                            <p className="text-sm text-destructive">
                                {errorMessage}
                            </p>
                        )}

                        {/* Image Preview */}
                        {hasImage && (
                            <div className="mt-3 p-3 border rounded-lg bg-muted/30">
                                <div className="flex items-start justify-between mb-2">
                                    <p className="text-xs font-medium">Preview:</p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={clearImage}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        <span className="sr-only">Remove image</span>
                                    </Button>
                                </div>
                                <div className="flex items-start gap-3">
                                    <img
                                        src={displayImage}
                                        alt="Event preview"
                                        className="w-20 h-20 rounded-lg object-cover"
                                        onError={() => {
                                            setImageError(true)
                                            setErrorMessage("Failed to load image")
                                        }}
                                        loading="lazy"
                                    />
                                    <div className="flex-1 min-w-0">
                                        {imageFile && (
                                            <p className="text-xs font-medium mb-1 truncate">
                                                {imageFile.name}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            This image will appear in the calendar, event cards, and event details.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Fallback indicator */}
                        {!hasImage && !isProcessing && (
                            <div className="mt-3 p-3 border rounded-lg bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                        <CalendarCheck className="h-10 w-10 text-primary/40" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground">
                                            Without an image, a default calendar icon will be displayed.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                resetForm()
                                onOpenChange(false)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isFormValid}>
                            <CalendarCheck className="h-4 w-4 mr-2" />
                            {isProcessing ? "Processing..." : "Create Event"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
