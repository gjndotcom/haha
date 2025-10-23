import React, { useState, useCallback } from 'react';
import { recognizeCharacter, generateGhibliImage } from './services/geminiService';

enum AppState {
  IDLE,
  ANALYZING,
  GENERATING,
  SUCCESS,
  ERROR,
}

interface UploadedFile {
    file: File;
    previewUrl: string;
}

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve({ base64, mimeType: file.type });
        };
        reader.onerror = (error) => reject(error);
    });
};

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export default function App() {
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [appState, setAppState] = useState<AppState>(AppState.IDLE);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadedFile({
                file,
                previewUrl: URL.createObjectURL(file),
            });
            setAppState(AppState.IDLE);
            setErrorMessage('');
            setGeneratedImage(null);
        }
    };
    
    const handleSubmit = useCallback(async () => {
        if (!uploadedFile) return;

        try {
            setAppState(AppState.ANALYZING);
            const image_data = await fileToBase64(uploadedFile.file);
            const isCharacter = await recognizeCharacter(image_data);

            if (isCharacter) {
                setAppState(AppState.GENERATING);
                const newImage = await generateGhibliImage(image_data);
                if (newImage) {
                    setGeneratedImage(newImage);
                    setAppState(AppState.SUCCESS);
                } else {
                    setErrorMessage('Failed to generate the image. Please try again.');
                    setAppState(AppState.ERROR);
                }
            } else {
                setErrorMessage('This does not seem to be a character, person, or animal. Please upload a different image.');
                setAppState(AppState.ERROR);
            }
        } catch (error) {
            console.error(error);
            setErrorMessage('An unexpected error occurred. Please check the console and try again.');
            setAppState(AppState.ERROR);
        }
    }, [uploadedFile]);

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = 'ghibli-character.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setUploadedFile(null);
        setGeneratedImage(null);
        setAppState(AppState.IDLE);
        setErrorMessage('');
    };

    const getStatusMessage = () => {
        switch (appState) {
            case AppState.ANALYZING:
                return 'Analyzing image...';
            case AppState.GENERATING:
                return 'Character found! Generating your Trumpi version...';
            default:
                return '';
        }
    }

    const renderContent = () => {
        if (appState === AppState.SUCCESS && generatedImage) {
            return (
                <div className="text-center w-full max-w-lg">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Ghibli Character!</h2>
                    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                        <img src={generatedImage} alt="Generated Ghibli-style character" className="rounded-md w-full h-auto object-contain" />
                    </div>
                    <div className="mt-6 flex justify-center space-x-4">
                        <button
                            onClick={handleDownload}
                            className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition duration-200"
                        >
                            Download
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition duration-200"
                        >
                            Start Over
                        </button>
                    </div>
                </div>
            );
        }

        if (appState === AppState.ANALYZING || appState === AppState.GENERATING) {
            return (
                <div className="text-center w-full max-w-md">
                     <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 mb-4">
                        <img src={uploadedFile?.previewUrl} alt="Uploaded preview" className="rounded-md max-h-80 mx-auto" />
                    </div>
                    <div className="flex items-center justify-center p-4 bg-blue-500 text-white rounded-lg shadow-lg">
                        <Spinner />
                        <span className="font-semibold">{getStatusMessage()}</span>
                    </div>
                </div>
            )
        }
        
        return (
            <div className="w-full max-w-lg text-center">
                <div className="mb-6">
                    <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition duration-200 block p-8"
                    >
                        {uploadedFile ? (
                            <img src={uploadedFile.previewUrl} alt="Preview" className="mx-auto max-h-60 rounded-md" />
                        ) : (
                            <div className="flex flex-col items-center">
                                <UploadIcon />
                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                    Click to upload an image
                                </span>
                                <span className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</span>
                            </div>
                        )}
                        <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </label>
                </div>
                {errorMessage && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                        <strong className="font-bold">Oops! </strong>
                        <span className="block sm:inline">{errorMessage}</span>
                    </div>
                )}
                <button
                    onClick={handleSubmit}
                    // FIX: Redundant state checks removed. This button is not rendered during
                    // ANALYZING or GENERATING states, so the checks were unnecessary and caused
                    // a compile-time error.
                    disabled={!uploadedFile}
                    className="w-full px-6 py-4 bg-blue-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
                >
                    Create My Ghibli Character
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-200 flex flex-col items-center justify-center p-4 font-sans">
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col items-center">
                <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Ghibli Character Creator</h1>
                <p className="text-gray-600 mb-8 text-center">Upload a character, and we'll magically transform it into a Ghibli-style masterpiece!</p>
                {renderContent()}
            </div>
        </div>
    );
}