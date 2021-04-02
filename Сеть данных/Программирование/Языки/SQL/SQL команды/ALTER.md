# ALTER
*теги:* #database, #sql, #DBddl 
*описание:* изменение струтуры, добавление столбцов. *Пока у вас открыта транзакция с этими командами, никто не может добавлять значения в таблицу*.

---

### Добавление столбцов
**Шаблон добавления столбцов:**
>ALTER TABLE table_name
>ADD (column_name data_type DEFAULT expr);

Пример:
```sql
alter table students add (cource number default 3);
```

### Изменение столбцов
**Шаблон изменения столбцов:**
>ALTER TABLE table_name
>MODIFY (column_name data_type DEFAULT expr);

==MODIFY== не срабатывает, если изменения могут нарушить имеющиеся данные.

Пример:
```sql
alter table STUDENTS
    modify (avg_score number(5,3));
```

**Избавляемся от значения по умолчанию:**
```sql
alter table students modify (start_date date default null)
```

### Удаление столбцов
**Шаблон:**
>ALTER TABLE table_name
>DROP COLUMN column_name;

Пример:
```sql
alter table STUDENTS
    drop column SCHOLARSHIP;
```

*Мы не можем удалять столбца, на которые ссылаются столбцы из других таблиц*.

### Исключаем столбцы (делаем неизменяемыми)
С помщью set unused мы исключаем колонку из таблицы, но удалиться она немного попозже. Удаление с помощью drop занимает много времени.

**Template:**
>ALTER TABLE table_name
>SET UNUSED COLUMN column_name;

**Template for delete:**
>ALTER TABLE table_name
>DROP UNUSED COLUMNS;

Пример:
```sql
alter table STUDENTS
    set unused column start_date;
alter table STUDENTS
    drop unused columns;
```

### Изменяем название столбцов
**Template:**
>ALTER TABLE table_name
>RENAME COLUMN column_name to new_column_name;

Пример:
```sql
alter table STUDENTS
    rename column student_id to id;
```

### Делаем таблицу только для чтения
После этого к таблице можно будет применять только команды select, **НО ВЫ МОЖЕТЕ УДАЛИТЬ ТАБЛИЦУ**.

**Template:**
>ALTER TABLE table_name READ ONLY;

