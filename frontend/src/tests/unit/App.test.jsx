import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import App from '../../App.jsx';
import { useKeyboard } from '../../components/IfcViewer/hooks/useKeyboard';
import { IfcViewerAPI } from 'web-ifc-viewer';

// ---------- Общие моки ----------
const raycasterMock = {
  setFromCamera: vi.fn(),
  intersectObjects: vi.fn(() => []),
};

vi.mock('web-ifc-viewer', () => ({
  IfcViewerAPI: vi.fn().mockImplementation(() => {
    const scene = {
      add: vi.fn(),
      remove: vi.fn(),
      children: [],
      background: null,
    };

    const renderer = {
      setClearColor: vi.fn(),
      clippingPlanes: null,
      localClippingEnabled: false,
    };

    const camera = {};

    return {
      IFC: {
        loadIfc: vi.fn().mockResolvedValue({ modelID: 123 }),
        getSpatialStructure: vi.fn().mockResolvedValue({ type: 'PROJECT', children: [] }),
        removeModel: vi.fn().mockResolvedValue(),
        selector: {
          pickIfcItem: vi.fn(),
          pickIfcItemsByID: vi.fn(),
          unpickIfcItems: vi.fn(),
        },
        getProperties: vi.fn().mockResolvedValue({ Name: 'Test Wall' }),
        setWasmPath: vi.fn(),
        context: { items: { ifcModels: {} } },
      },
      axes: { setAxes: vi.fn() },
      grid: { setGrid: vi.fn() },
      context: {
        getScene: vi.fn(() => scene),
        getRenderer: vi.fn(() => renderer),
        getCamera: vi.fn(() => camera),
      },
      dispose: vi.fn(),
    };
  }),
}));

vi.mock('three', () => ({
  Color: vi.fn(function Color() {}),

  Plane: vi.fn(() => ({
    setFromNormalAndCoplanarPoint: vi.fn(),
  })),

  Vector3: vi.fn(() => {
    const vec = {
      x: 0,
      y: 0,
      z: 0,
      length: vi.fn(() => 10),
    };
    return vec;
  }),

  Box3: vi.fn(() => {
    const box = {
      setFromObject: vi.fn(() => box),
      getSize: vi.fn(() => ({
        length: vi.fn(() => 10),
      })),
    };
    return box;
  }),

  Raycaster: vi.fn(() => raycasterMock),
  Vector2: vi.fn(),
}));

vi.mock('../../components/IfcViewer/TreeItem', () => ({
  TreeItem: ({ node, onSelect, selectedId }) => (
    <div data-testid="tree-item" onClick={() => onSelect(node.expressID)}>
      {node.type} {selectedId === node.expressID && '(selected)'}
    </div>
  ),
}));

vi.mock('../../components/IfcViewer/hooks/useKeyboard', () => ({
  useKeyboard: vi.fn(),
}));

vi.mock('../../components/ui/utils/clippingLogic', () => ({
  createCustomPlaneHelper: vi.fn(() => ({
    material: { color: { setHex: vi.fn() } },
    children: [],
  })),
  getFaceNormal: vi.fn(() => ({ x: 0, y: 0, z: 1 })),
}));

global.fetch = vi.fn();

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

const renderApp = () => render(<App />);

const setAuthToken = (token = 'token') => {
  localStorageMock.getItem.mockReturnValue(token);
};

const mockOkJson = (data) => ({
  ok: true,
  json: async () => data,
});

const mockSuccessfulLoginFlow = () => {
  global.fetch
    .mockResolvedValueOnce(mockOkJson({ access: 'fake-token' }))
    .mockResolvedValueOnce(mockOkJson([]));
};

const getViewerInstance = () => IfcViewerAPI.mock.results[0]?.value;
const getViewerContainer = () => document.querySelector('main > div');


describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    global.fetch.mockReset();
    raycasterMock.setFromCamera.mockClear();
    raycasterMock.intersectObjects.mockReset();
    raycasterMock.intersectObjects.mockReturnValue([]);

    delete window.location;
    window.location = {
      reload: vi.fn(),
      href: '',
      assign: vi.fn(),
    };
  });

  describe('Аутентификация', () => {
    test('Показывает форму входа при отсутствии токена', () => {
      renderApp();

      expect(screen.getByPlaceholderText('Логин')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ВОЙТИ/i })).toBeInTheDocument();
    });

    test('Успешный вход сохраняет токен и показывает интерфейс', async () => {
      const user = userEvent.setup();

      renderApp();
      mockSuccessfulLoginFlow();

      await user.type(screen.getByPlaceholderText('Логин'), 'testuser');
      await user.type(screen.getByPlaceholderText('Пароль'), 'password');
      await user.click(screen.getByRole('button', { name: /ВОЙТИ/i }));

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'fake-token');
        expect(screen.getByText(/Дерево проекта/i)).toBeInTheDocument();
      });
    });

    test('Отображает ошибку при неверных данных', async () => {
      const user = userEvent.setup();

      renderApp();
      global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

      await user.click(screen.getByRole('button', { name: /ВОЙТИ/i }));

      await waitFor(() => {
        expect(screen.getByText(/Неверные данные для входа/i)).toBeInTheDocument();
      });
    });

    test('Выход очищает токен и перезагружает страницу', async () => {
      const user = userEvent.setup();

      setAuthToken('fake-token');
      global.fetch.mockResolvedValueOnce(mockOkJson([]));

      renderApp();

      await waitFor(() => screen.getByTitle('Выйти'));

      await user.click(screen.getByTitle('Выйти'));

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('Основной интерфейс', () => {
    beforeEach(() => {
      setAuthToken('token');
      global.fetch.mockResolvedValue(mockOkJson([]));
    });

    test('Инициализирует IfcViewerAPI при наличии токена', async () => {
      renderApp();

      await waitFor(() => {
        expect(IfcViewerAPI).toHaveBeenCalled();
      });
    });

    test('Загружает локальный .ifc файл через input и отображает дерево', async () => {
      const user = userEvent.setup();

      renderApp();

      const file = new File(['dummy'], 'model.ifc', { type: 'application/octet-stream' });
      const fileInput = document.querySelector('input[type="file"]');
      vi.spyOn(window, 'confirm').mockReturnValueOnce(false);

      await user.upload(fileInput, file);

      await waitFor(() => {
        const viewerInstance = getViewerInstance();
        expect(viewerInstance.IFC.loadIfc).toHaveBeenCalledWith(file, true);
        expect(viewerInstance.IFC.getSpatialStructure).toHaveBeenCalled();
        expect(screen.getByTestId('tree-item')).toBeInTheDocument();
      });
    });

    test('Клик по элементу выделяет его и показывает свойства', async () => {
      const user = userEvent.setup();

      renderApp();

      const viewerInstance = getViewerInstance();
      viewerInstance.IFC.selector.pickIfcItem.mockResolvedValueOnce({ id: 42 });
      viewerInstance.IFC.selector.pickIfcItemsByID.mockResolvedValueOnce(undefined);
      viewerInstance.IFC.getProperties.mockResolvedValueOnce({ Name: 'Test Column' });

      const viewerContainer = getViewerContainer();
      expect(viewerContainer).toBeTruthy();

      await user.click(viewerContainer);

      await waitFor(() => {
        expect(viewerInstance.IFC.selector.pickIfcItemsByID).toHaveBeenCalledWith(0, [42]);
        expect(screen.getByText(/Test Column/i)).toBeInTheDocument();
      });
    });

    test('Двойной клик создаёт плоскость среза', async () => {
      const user = userEvent.setup();

      renderApp();

      raycasterMock.intersectObjects.mockReturnValueOnce([
        {
          object: { userData: {} },
          face: {},
          point: { x: 1, y: 2, z: 3 },
        },
      ]);

      const viewerContainer = getViewerContainer();
      expect(viewerContainer).toBeTruthy();

      await user.dblClick(viewerContainer);

      await waitFor(() => {
        expect(screen.getByText(/Срез #1/i)).toBeInTheDocument();
        expect(screen.getByText(/СНЯТЬ ВЫДЕЛЕНИЕ/i)).toBeInTheDocument();
      });
    });

    test('Удаляет плоскость среза', async () => {
      const user = userEvent.setup();

      renderApp();

      raycasterMock.intersectObjects.mockReturnValueOnce([
        {
          object: { userData: {} },
          face: {},
          point: { x: 1, y: 2, z: 3 },
        },
      ]);

      const viewerContainer = getViewerContainer();
      expect(viewerContainer).toBeTruthy();

      await user.dblClick(viewerContainer);

      await waitFor(() => screen.getByText(/Срез #1/i));

      const deleteBtn = screen.getByRole('button', { name: '✕' });
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(screen.queryByText(/Срез #1/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/СНЯТЬ ВЫДЕЛЕНИЕ/i)).not.toBeInTheDocument();
      });
    });

    test('Смена темы меняет фон', async () => {
      const user = userEvent.setup();

      renderApp();

      const themeToggle = screen.getByRole('button', { name: /☀️|🌙/ });
      await user.click(themeToggle);

      const viewerInstance = getViewerInstance();
      expect(viewerInstance.context.getScene().background).not.toBeNull();
    });
  });

  describe('Облачные файлы', () => {
    beforeEach(() => {
      setAuthToken('token');
    });

    test('Список файлов', async () => {
      global.fetch.mockResolvedValueOnce(
        mockOkJson([{ filename: 'project1.ifc' }, { filename: 'project2.ifc' }])
      );

      renderApp();

      await waitFor(() => {
        expect(screen.getByText('project1.ifc')).toBeInTheDocument();
        expect(screen.getByText('project2.ifc')).toBeInTheDocument();
      });
    });

    test('Загрузка файла', async () => {
      const user = userEvent.setup();

      global.fetch.mockResolvedValueOnce(mockOkJson([{ filename: 'project1.ifc' }]));
      global.fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['dummy']),
      });

      renderApp();

      await waitFor(() => screen.getByText('project1.ifc'));

      await user.click(screen.getByText('project1.ifc'));

      await waitFor(() => {
        const viewerInstance = getViewerInstance();
        expect(viewerInstance.IFC.loadIfc).toHaveBeenCalled();
        expect(viewerInstance.IFC.getSpatialStructure).toHaveBeenCalled();
      });
    });

    test('Удаление файла', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

      global.fetch.mockResolvedValueOnce(mockOkJson([{ filename: 'project1.ifc' }]));
      global.fetch.mockResolvedValueOnce({ ok: true });
      global.fetch.mockResolvedValueOnce(mockOkJson([]));

      renderApp();

      await waitFor(() => screen.getByText('project1.ifc'));

      const deleteBtn = screen.getAllByRole('button', { name: '🗑️' })[0];
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://test-api/api/delete/project1.ifc/',
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });
  });

  describe('useKeyboard', () => {
    beforeEach(() => {
      setAuthToken('token');
      global.fetch.mockResolvedValue(mockOkJson([]));
    });

    test('вызывается с параметрами', async () => {
      renderApp();

      await waitFor(() => {
        expect(useKeyboard).toHaveBeenCalled();
        const args = useKeyboard.mock.calls[0];
        expect(args[0]).toBe('z');
        expect(args[1]).toBeDefined();
        expect(args[2]).toBeDefined();
        expect(args[3]).toBeDefined();
        expect(typeof args[4]).toBe('function');
        expect(typeof args[5]).toBe('function');
      });
    });
  });

  describe('Граничные случаи', () => {
    test('ошибка загрузки – alert', async () => {
      const user = userEvent.setup();

      setAuthToken('token');
      global.fetch.mockResolvedValueOnce(mockOkJson([{ filename: 'project1.ifc' }]));
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderApp();

      await waitFor(() => screen.getByText('project1.ifc'));

      await user.click(screen.getByText('project1.ifc'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Не удалось загрузить модель.');
      });
    });

    test('401 при списке файлов', async () => {
      setAuthToken('token');
      global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });

      renderApp();

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
        expect(window.location.reload).toHaveBeenCalled();
      });
    });

    test('очистка сцены', async () => {
      const user = userEvent.setup();

      setAuthToken('token');
      global.fetch.mockResolvedValue(mockOkJson([]));

      renderApp();

      const viewerInstance = getViewerInstance();
      viewerInstance.IFC.context.items.ifcModels = {
        1: { modelID: 1, mesh: {} },
      };

      const file = new File(['dummy'], 'model.ifc', { type: 'application/octet-stream' });
      const fileInput = document.querySelector('input[type="file"]');
      vi.spyOn(window, 'confirm').mockReturnValueOnce(false);

      await user.upload(fileInput, file);

      expect(viewerInstance.IFC.removeModel).toHaveBeenCalledWith(1);
      expect(viewerInstance.context.getScene()).toBeDefined();
    });
  });
});